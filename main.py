from utils.utils import get_settings, get_logger
from openai import OpenAI

# Initialize settings and logger
settings = get_settings()
logger = get_logger(settings.LOGS_PATH)

openai_api_key = settings.OPENAI_API_KEY
client = OpenAI(api_key=openai_api_key)


from fastapi import FastAPI, HTTPException, Response, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from jobs_progress import create_job,get_job,update_job_progress,get_all_jobs
from pydantic import BaseModel, EmailStr, field_validator
from urllib.parse import urlparse
import re, transcribe, download, db, os, json, concurrent.futures, time

from create_vector_db import add_new_transcript
import itsdangerous
from db import delete_highlight, update_highlight, get_highlights_for_video, add_highlight
from fastapi.middleware.cors import CORSMiddleware
from rag import ask, ask_from_all_videos
from typing import Optional

logger.info(f"Loaded config for env: {settings.current_env}")
logger.debug(f"OpenAI API key loaded: {openai_api_key[:5]}...")  # Log partial key for security

app = FastAPI()

MAX_RETRIES = 3
VIDEO_DIR = "videos"
os.makedirs(VIDEO_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")
video_jobs = {}
executor = concurrent.futures.ThreadPoolExecutor(max_workers=20)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",  # frontend dev environment
        "https://www.askskylar.ai",
        "https://tiktokcartelle.techaiapps.com"
        ], 
    allow_credentials=True,                  
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cookie signing
SECRET_KEY = settings.SECRET_KEY 
serializer = itsdangerous.URLSafeSerializer(SECRET_KEY)

# --- Models ---
class ImportRequest(BaseModel):
    url: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    def password_strength(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Must include uppercase")
        if not re.search(r"\d", value):
            raise ValueError("Must include digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Must include special character")
        return value

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    def password_strength(cls, value):
        return value  # No need to validate again during login

class QueryRequest(BaseModel):
    video_id: int
    question: str

class CrossVideoQueryRequest(BaseModel):
    question: str

class HighlightBase(BaseModel):
    title: str
    text: str
    color: str

class HighlightCreate(HighlightBase):
    video_id: int

class HighlightUpdate(BaseModel):
    title: str
    color: str

class Highlight(HighlightBase):
    id: int
    video_id: int
    created_at: str

class CollectionCreate(BaseModel):
    user_id: int
    name: str
    color: Optional[str] = '#3b82f6'
    icon: Optional[str] = 'Folder'

class CollectionUpdate(BaseModel):
    collection_id: int
    video_id: int

class Config:
    orm_mode = True

def clean_tiktok_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up application...")

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Shutting down application...")
    executor.shutdown(wait=True)

@app.post("/signup")
def signup(req: SignupRequest):
    try:
        user = db.add_user(req.email, req.password)
        if user: 
            logger.info(f"New user signed up: {req.email}")
            return {"user_id": user, "detail": "Registration Successful, Login now!"}
        else: 
            logger.warning(f"User already exists: {req.email}")
            raise HTTPException(status_code=404, detail="User already exists")
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/login")
def login(req: LoginRequest, response: Response):
    try:
        result = db.validate_user(req.email, req.password)
        logger.debug(f"Login attempt for user: {req.email}")
        
        if "error" in result:
            logger.warning(f"Failed login attempt for user: {req.email}")
            raise HTTPException(status_code=401, detail=result["error"])
            
        token = serializer.dumps({"user_id": result["user_id"], "email": req.email})
        response.set_cookie(
            key="session",
            value=token,
            httponly=True,
            samesite="None",
            secure=True,
            path="/",
        )
        logger.info(f"Successful login for user: {req.email}")
        return {
            "message": "Login successful",
            "user_id": result["user_id"], 
            "email": req.email
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/logout")
def logout(response: Response):
    try:
        response.set_cookie(
            key="session",
            value="",
            max_age=0,
            expires=0,
            path="/",
            secure=True,
            httponly=True,
            samesite='None'
        )
        logger.info("User logged out")
        return {"message": "Logged out"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_current_user(request: Request):
    try:
        cookie = request.cookies.get("session")
        if not cookie:
            logger.warning("No session cookie found")
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        user_data = serializer.loads(cookie)
        logger.debug(f"Authenticated user: {user_data['email']}")
        return user_data
    except itsdangerous.BadData:
        logger.warning("Invalid session cookie")
        raise HTTPException(status_code=401, detail="Invalid session")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/import_video")
def import_video(
    req: ImportRequest, 
    user=Depends(get_current_user),
):
    try:
        user_id = user["user_id"]
        req.url = clean_tiktok_url(req.url)
        logger.info(f"Import video request from user {user_id} for URL: {req.url}")

        # Check for existing jobs for this URL
        all_jobs = get_all_jobs()
        for job_id, job in all_jobs.items():
            if job["url"] == req.url and job["status"] not in ["Failed", "Completed"]:
                logger.info(f"Video already being processed: {req.url}")
                return {
                    "message": "Video is already being processed.",
                    "clean_url": req.url,
                    "job_id": job_id,
                    "status": job["status"],
                    "progress": job.get("progress", 0)
                }

        # Create a new job
        job_id = create_job(req.url, user_id)
        executor.submit(import_worker, job_id, user_id, req.url)

        return {
            "message": "Video import started",
            "clean_url": req.url,
            "job_id": job_id,
            "status": "Queued",
            "progress": 0
        }
    except Exception as e:
        logger.error(f"Video import error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Update the progress endpoint
@app.post("/progress")
async def get_progress(request: Request):
    try:
        data = await request.json()
        job_id = data.get("job_id")
        
        job = get_job(job_id)
        print(job)
        if not job:
            return {"status": "not_found"}
           
        return {
            "status": job["status"],
            "progress": job.get("progress", 0),
            "message": job.get("message", ""),
            "url": job["url"]
        }
    except Exception as e:
        logger.error(f"Progress check error: {str(e)}")
        return {"error": str(e)}

@app.post("/videos")
def get_user_videos(user=Depends(get_current_user)):
    try:
        videos = db.get_videos_for_user(user["user_id"])
        logger.info(f"Retrieved videos for user {user['user_id']}")
        return [
            {
                "id": v["id"],
                "url": v["url"],
                "file_path": f"/videos/{os.path.basename(v['file_path']).replace(os.sep, '/')}",
                "transcript": v["transcript"],
                "video_playcount": v["video_playcount"],
                "video_diggcount": v["video_diggcount"],
                "video_commentcount": v["video_commentcount"],
                "video_sharecount": v["video_sharecount"],
                "summary": v["summary"],
                "description": v["video_description"],
                "tags": v["tags"],
                "niche":v["niche"],
            }
            for v in videos
        ]
    except Exception as e:
        logger.error(f"Error getting user videos: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/query")
def query_video(req: QueryRequest, user=Depends(get_current_user)):
    try:
        logger.info(f"Query request for video {req.video_id} by user {user['user_id']}")
        answer = ask(question=req.question, video_id=req.video_id)
        return answer
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def import_worker(job_id: str,user_id, url):
    try:
        update_job_progress(job_id, "Downloading", 10, "Starting download")
        logger.info(f"Starting download for URL: {url}")
        
        existing = db.get_video_by_url(url)
        print("DB BACK:",existing)
        if existing:
            print("inside f")
            print (type(user_id))
            print (type(existing["id"]))
            db.link_user_video(user_id, existing["id"])
            print("vidoe linked")
            update_job_progress(job_id, "Completed", 100, "Video already existed - linked to account")
            logger.info(f"Video already exists, linked to user: {url}")
            return

        file_path, metadata = None, None
        for attempt in range(MAX_RETRIES):
            try:
                update_job_progress(job_id, "Downloading", 15 + attempt*5, f"Download attempt {attempt+1}")
                file_path, metadata = download.download_video(url)
                if not os.path.exists(file_path) or os.path.getsize(file_path) < 1000:
                    raise Exception("Download failed or returned small file")
                break
            except Exception as e:
                logger.warning(f"[Download Retry {attempt+1}] Error: {e}")
        else:
            error_msg = "Failed to download video after retries"
            update_job_progress(job_id, "Failed", 0, error_msg)
            logger.error(error_msg)
            raise Exception(error_msg)
        update_job_progress(job_id, "Transcribing", 40, "Starting transcription")
        logger.info(f"Starting transcription for URL: {url}")
        transcript = ""
        for attempt in range(MAX_RETRIES):
            try:
                update_job_progress(job_id, "Transcribing", 45 + attempt*5, f"Transcription attempt {attempt+1}")

                transcript = transcribe.transcribe_audio(file_path)
                if transcript.strip() == "":
                    raise Exception("Empty transcript")
                print(transcript)
                break
            except Exception as e:
                logger.warning(f"[Transcription Retry {attempt+1}] Error: {e}")
        else:
            error_msg = "Failed to transcribe video after retries"
            logger.error(error_msg)
            update_job_progress(job_id, "Failed", 40, error_msg)
            raise Exception(error_msg)
        update_job_progress(job_id, "Analyzing", 70, "Generating summary and tags")
        summary_tags_prompt = f"""
You are a content summarizer for short videos. Given the transcript below, produce:

1. A concise 2-3 sentence summary of what the video is about.
<<<<<<< HEAD
2. A list of 10 relevant tags (hashtags or keywords) describing the video content with the "#" format.
3. Identify 5 best hooks from the transcript of the video with hook title and hook text. and also rank the confidence score of the hooks from 0-1)
4. Classify the style of the video by analyzing, what category/niche it belongs , from the following provided:
{{1: Voice-over
-------------
Narration explaining visuals or storytelling.
Used for tutorials, behind-the-scenes, etc.

2: Talking Head
---------------
Person speaking directly to the camera.
Often includes opinions, advice, or promotional content.

3: Podcast
----------
Conversational or interview-style format.
Includes back-and-forth dialogue or monologues.

4: Educational
--------------
Step-by-step guides or knowledge-based explanations.
Uses clear structure like “Step 1... Step 2...” or “Here’s how…”

5: Storytime
------------
Personal narratives, often starting with a hook.
Structured in beginning–middle–end format.

4: Commentary
-------------
Creator gives opinion on a topic or video.
Often includes phrases like “Let’s talk about…” or “Here’s what I think…”

5: Listicle
-----------
Structured as “Top 5 tips…” or “3 things you didn’t know…”
Uses numbered sections or predictable format.

6: Motivational
---------------
Uplifting speeches or affirmations.
Format: “You are capable of…” or “Don’t give up…”

7: Promotional
--------------
Clear CTA, product/service mention, benefit-focused.
Format: “Introducing…”, “You need this because…”}}

Transcript:
{transcript}

Return your response in dict format:
  {{"summary": "video-summary",
  "tags": ["tag1", "tag2"],
  "hooks":{{
      "hook-title":["title1","title2"],
      "hook-text":["tex1","text2"],
      "confidence-score":["score1","score2","score3"]}}
  }},
  Niche:"video-niche" """
        summary = ""
        tags = []
        for attempt in range(MAX_RETRIES):
            try:
                update_job_progress(job_id, "Analyzing", 75 + attempt*5, f"Analysis attempt {attempt+1}")

                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You summarize TikTok transcripts into 2-3 lines."},
                        {"role": "user", "content": summary_tags_prompt}
                    ],
                )
                response = response.choices[0].message.content.strip()
                response = re.search(r'```json(.*?)```', response, re.DOTALL)
                response = response.group(1).strip()
                logger.debug(f"GPT response: {response}")
                data = json.loads(response)
                summary = data["summary"]
                tags = data["tags"]
                niche=data["Niche"]
                print(niche)
                break
            except Exception as e:
                logger.warning(f"[Summary Retry {attempt+1}] Error: {e}")
        else:
            error_msg = "Failed to get summary after retries"
            update_job_progress(job_id, "Failed", 70, error_msg)
            logger.error(error_msg)
            raise Exception(error_msg)
        try:
            update_job_progress(job_id, "Saving", 90, "Saving video data")
            video_id = db.add_video_record(url, file_path, transcript, metadata, summary, tags,niche)
            logger.info(f"Successfully added video record for URL: {url}")
            db.link_user_video(user_id, video_id)
            for title, text, score in zip(
                data["hooks"]["hook-title"],
                data["hooks"]["hook-text"],
                data["hooks"]["confidence-score"]
            ):
                highlight_id = add_highlight(
                    user_id=user_id,
                    video_id=video_id,
                    title=title,
                    text=text,
                    color="yellow",
                    confidence_score=float(score)
                )
        except Exception as e:
            logger.error(f"Video Saving failed: {e}")
        add_new_transcript(transcript,video_id)
        logger.info(f"Added transcript to vector DB for video ID: {video_id}")
        update_job_progress(job_id, "Completed", 100, "Video processing completed")
        logger.info(f"Video processing completed for URL: {url}")
    except Exception as e:
        error_msg = f"Failed to process video {url}: {str(e)}"
        logger.error(error_msg)
        update_job_progress(job_id, "Failed", 0, error_msg)

@app.post("/query_across_videos")
def query_across_videos(req: CrossVideoQueryRequest, user=Depends(get_current_user)):
    try:
        logger.info(f"Cross-video query from user {user['user_id']}: {req.question}")
        answer =ask_from_all_videos(question=req.question, user_id=user["user_id"])
        return answer
    except Exception as e:
        logger.error(f"Cross-video query error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
        
@app.post("/highlights/")
async def create_highlight(highlight: HighlightCreate, db=Depends(db.get_db), user=Depends(get_current_user)):
    try:
        highlight_id = add_highlight(
            user_id=user["user_id"],
            video_id=highlight.video_id,
            title=highlight.title,
            text=highlight.text,
            color=highlight.color
        )
        logger.info(f"Created highlight {highlight_id} for video {highlight.video_id}")
        return {"id": highlight_id, "message": "Highlight created successfully"}
    except Exception as e:
        logger.error(f"Highlight creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/highlights/{video_id}")
async def get_highlights(video_id: int, db=Depends(db.get_db), user=Depends(get_current_user)):
    try:
        highlights = get_highlights_for_video(user["user_id"], video_id)
        logger.debug(f"Retrieved highlights for video {video_id}")
        return {"highlights": highlights}
    except Exception as e:
        logger.error(f"Get highlights error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/highlights/{highlight_id}")
async def update_highlights(
    highlight_id: int, 
    highlight: HighlightUpdate, 
    db=Depends(db.get_db), 
    user=Depends(get_current_user)
):
    try:
        success = update_highlight(
            highlight_id=highlight_id,
            title=highlight.title,
            color=highlight.color
        )
        if not success:
            logger.warning(f"Highlight not found: {highlight_id}")
            raise HTTPException(status_code=404, detail="Highlight not found")
        logger.info(f"Updated highlight {highlight_id}")
        return {"message": "Highlight updated successfully"}
    except Exception as e:
        logger.error(f"Highlight update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/highlights/{highlight_id}")
async def delete_highlights(highlight_id: int, db=Depends(db.get_db), user=Depends(get_current_user)):
    try:
        success = delete_highlight(highlight_id)
        if not success:
            logger.warning(f"Highlight not found for deletion: {highlight_id}")
            raise HTTPException(status_code=404, detail="Highlight not found")
        logger.info(f"Deleted highlight {highlight_id}")
        return {"message": "Highlight deleted successfully"}
    except Exception as e:
        logger.error(f"Highlight deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/collections/create")
def create_collection(data: CollectionCreate, user=Depends(get_current_user)):
    try:
        collection_id = db.create_collection(
            user["user_id"], 
            data.name,
            data.color,
            data.icon
        )
        logger.info(f"Created collection {collection_id} for user {user['user_id']}")
        return {"success": True, "collection_id": collection_id}
    except Exception as e:
        logger.error(f"Collection creation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/collections/delete/{user_id}/{collection_id}")
def delete_collection(user_id: int, collection_id: int, user=Depends(get_current_user)):
    try:
        db.delete_collection(user["user_id"], collection_id)
        logger.info(f"Deleted collection {collection_id} for user {user['user_id']}")
        return {"success": True}
    except Exception as e:
        logger.error(f"Collection deletion error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/collections/{user_id}")
def get_user_collections(user_id: int, user=Depends(get_current_user)):
    try:
        collections = db.get_collections(user["user_id"])
        logger.debug(f"Retrieved collections for user {user['user_id']}")
        return {"success": True, "collections": collections}
    except Exception as e:
        logger.error(f"Get collections error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/collections/add_video")
def add_video(data: CollectionUpdate):
    try:
        db.add_video_to_collection(data.collection_id, data.video_id)
        logger.info(f"Added video {data.video_id} to collection {data.collection_id}")
        return {"success": True}
    except Exception as e:
        logger.error(f"Add video to collection error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/collections/remove_video")
def remove_video(data: CollectionUpdate):
    try:
        db.remove_video_from_collection(data.collection_id, data.video_id)
        logger.info(f"Removed video {data.video_id} from collection {data.collection_id}")
        return {"success": True}
    except Exception as e:
        logger.error(f"Remove video from collection error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/collections/{collection_id}/videos")
def get_collection_videos(collection_id: int):
    try:
        videos = db.get_collection_videos(collection_id)
        logger.debug(f"Retrieved videos for collection {collection_id}")
        return {"success": True, "videos": videos}
    except Exception as e:
        logger.error(f"Get collection videos error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/check-auth")
def check_auth(user=Depends(get_current_user)):
    logger.debug(f"Auth check for user {user['email']}")
    return {"authenticated": True, "user": user}
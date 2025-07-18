from fastapi import FastAPI, HTTPException, Query, Response, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, field_validator
from urllib.parse import urlparse
import openai, re, transcribe, download, db, os, uvicorn,json,sys,concurrent.futures, time
from openai import OpenAI
from rag import ask
from create_vector_db import add_new_transcript
import itsdangerous
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
app = FastAPI()
client = OpenAI()
db.init_db()

MAX_RETRIES = 3
VIDEO_DIR = "videos"
os.makedirs(VIDEO_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")
video_jobs = {}
executor = concurrent.futures.ThreadPoolExecutor(max_workers=20)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,                  
    allow_methods=["*"],
    allow_headers=["*"],
)
# ✅ Cookie signing
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-insecure-key") 
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

def clean_tiktok_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

@app.on_event("shutdown")
def shutdown_event():
    executor.shutdown(wait=True)

@app.post("/signup")
def signup(req: SignupRequest):
    user = db.add_user(req.email, req.password)
    return {"user_id": user} if user else {"error": "user already exists"}

# ✅ Secure login: Set cookie
@app.post("/login")
def login(req: LoginRequest, response: Response):
    result = db.validate_user(req.email, req.password)
    if "error" in result:
        return {"error": result["error"]}
    token = serializer.dumps({"user_id": result["user_id"], "email": req.email})
    response.set_cookie(
        key="session",
        value=token,
        httponly=False,
        samesite="None",
        secure=False,
        path="/",
    )
    return {"message": "Login successful",
            "user_id": result["user_id"], 
            "email": req.email
            }

# ✅ Logout: clear cookie
@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"message": "Logged out"}

# ✅ Auth extractor
def get_current_user(request: Request):
    cookie = request.cookies.get("session")
    if not cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return serializer.loads(cookie)
    except itsdangerous.BadData:
        raise HTTPException(status_code=401, detail="Invalid session")

@app.post("/import_video")
def import_video(req: ImportRequest, user=Depends(get_current_user)):
    user_id = user["user_id"]
    req.url = clean_tiktok_url(req.url)

    if req.url in video_jobs and video_jobs[req.url] not in ["Failed", "Completed"]:
        existing = db.get_video_by_url(req.url)
        return {
            "message": "Video is already being processed.",
            "clean_url": req.url,
            "video_id": existing["id"] if existing else None
        }

    video_jobs[req.url] = "Queued"
    executor.submit(import_worker, user_id, req.url)

    existing = db.get_video_by_url(req.url)
    video_id = existing["id"] if existing else None
    return {
        "message": "Video import started",
        "clean_url": req.url,
        "video_id": video_id
    }

@app.post("/progress")
def get_progress():
    return video_jobs

@app.post("/videos")
def get_user_videos(user=Depends(get_current_user)):
    try:
        videos = db.get_videos_for_user(user["user_id"])
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
            }
            for v in videos
        ]
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/query")
def query_video(req: QueryRequest, user=Depends(get_current_user)):
    answer = ask(question=req.question, video_id=req.video_id)
    return answer

def import_worker(user_id, url):
    try:
        video_jobs[url] = "Downloading"
        existing = db.get_video_by_url(url)
        if existing:
            db.link_user_video(user_id, existing["id"])
            video_jobs[url] = "Completed (linked)"
            return

        file_path, metadata = None, None
        for attempt in range(MAX_RETRIES):
            try:
                file_path, metadata = download.download_video(url)
                if not os.path.exists(file_path) or os.path.getsize(file_path) < 1000:
                    raise Exception("Download failed or returned small file")
                break
            except Exception as e:
                print(f"[Download Retry {attempt+1}] Error: {e}")
                time.sleep(1)
        else:
            raise Exception("Failed to download video after retries")

        video_jobs[url] = "Transcribing"
        transcript = ""
        for attempt in range(MAX_RETRIES):
            try:
                transcript = transcribe.transcribe_audio(file_path)
                if transcript.strip() == "":
                    raise Exception("Empty transcript")
                break
            except Exception as e:
                print(f"[Transcription Retry {attempt+1}] Error: {e}")
                time.sleep(2)
        else:
            raise Exception("Failed to transcribe video after retries")

        summary_prompt = f"Summarize this TikTok video transcript:\n\n{transcript}"
        summary = ""
        for attempt in range(MAX_RETRIES):
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You summarize TikTok transcripts into 2-3 lines."},
                        {"role": "user", "content": summary_prompt}
                    ],
                )
                summary = response.choices[0].message.content.strip()
                break
            except Exception as e:
                print(f"[Summary Retry {attempt+1}] Error: {e}")
                time.sleep(2)
        else:
            raise Exception("Failed to get summary after retries")

        video_id = db.add_video_record(url, file_path, transcript, metadata, summary)
        db.link_user_video(user_id, video_id)

        try:
            add_new_transcript(transcript, video_id=video_id)
        except Exception as e:
            raise Exception(f"Embedding failed: {e}")

        video_jobs[url] = "Completed"
    except Exception as e:
        video_jobs[url] = f"Failed: {str(e)}"

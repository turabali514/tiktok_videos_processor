# main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, field_validator
from urllib.parse import urlparse
import openai, re, transcribe, download, db, os, uvicorn,json,sys,concurrent.futures, subprocess, tempfile
import time
from openai import OpenAI

openai.api_key = os.getenv("OPENAI_API_KEY")
app = FastAPI()
client = OpenAI()
db.init_db()

MAX_RETRIES=3
VIDEO_DIR = "videos"
os.makedirs(VIDEO_DIR, exist_ok=True)
app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")
video_jobs = {}
executor = concurrent.futures.ThreadPoolExecutor(max_workers=20)

# --- Models ---
class ImportRequest(BaseModel):
    user_id: int
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
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Must include uppercase")
        if not re.search(r"\d", value):
            raise ValueError("Must include digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Must include special character")
        return value

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

@app.post("/login")
def login(req: LoginRequest):
    result = db.validate_user(req.email, req.password)

    if "error" in result:
        return {"error": result["error"]}

    return {"user_id": result["user_id"]}

# --- Import ---
def import_worker(user_id, url):
    import traceback
    try:
        video_jobs[url] = "Downloading"
        existing = db.get_video_by_url(url)
        if existing:
            db.link_user_video(user_id, existing["id"])
            video_jobs[url] = "Completed (linked)"
            return

        # --- DOWNLOAD with RETRIES ---
        file_path, metadata = None, None
        for attempt in range(MAX_RETRIES):
            try:
                file_path, metadata = download.download_video(url)
                if not os.path.exists(file_path) or os.path.getsize(file_path) < 1000:
                    raise Exception("Download failed or returned small file")
                break  # success
            except Exception as e:
                print(f"[Download Retry {attempt+1}] Error: {e}")
                time.sleep(1)
        else:
            raise Exception("Failed to download video after retries")

        # --- TRANSCRIPTION with RETRIES ---
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

        # --- OPENAI SUMMARY with RETRIES ---
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
                    max_tokens=150
                )
                summary = response.choices[0].message.content.strip()
                break
            except Exception as e:
                print(f"[Summary Retry {attempt+1}] Error: {e}")
                time.sleep(2)
        else:
            raise Exception("Failed to get summary after retries")

        # --- DB Save ---
        video_id = db.add_video_record(url, file_path, transcript, metadata, summary)
        db.link_user_video(user_id, video_id)

        with tempfile.NamedTemporaryFile(mode="w", delete=False, encoding="utf-8", suffix=".txt") as tf:
            tf.write(transcript)
            tf_path = tf.name

        env = os.environ.copy()
        env["EMBED_TEXT_PATH"] = tf_path
        env["VIDEO_ID"] = str(video_id)

        result = subprocess.run(
            [sys.executable, "embed_worker.py"],
            env=env,
            capture_output=True,
            text=True,
        )
        os.unlink(tf_path)

        if result.returncode != 0:
            raise Exception(f"Embedding failed:\n{result.stderr}")
        else:
            print(result.stdout)

        video_jobs[url] = "Completed"

    except Exception as e:
        video_jobs[url] = f"Failed: {str(e)}"
        print("[ERROR]", traceback.format_exc())

@app.post("/import_video")
def import_video(req: ImportRequest):
    req.url = clean_tiktok_url(req.url)

    if req.url in video_jobs and video_jobs[req.url] not in ["Failed", "Completed"]:
        existing = db.get_video_by_url(req.url)
        return {
            "message": "Video is already being processed.",
            "clean_url": req.url,
            "video_id": existing["id"] if existing else None
        }

    video_jobs[req.url] = "Queued"
    executor.submit(import_worker, req.user_id, req.url)

    # Try to return existing video ID immediately if available
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
def get_user_videos(user_id: int = Query(...)):
    try:
        videos = db.get_videos_for_user(user_id)
        return [
            {
                "id": v["id"],
                "url": v["url"],
                "file_path": f"http://127.0.0.1:8000/videos/{os.path.basename(v['file_path']).replace(os.sep, '/')}",
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
def query_video(req: QueryRequest):
    
    print("🎯 Launching RAG subprocess...")
    print("started:")
    start_time = time.time()
    script_path = os.path.join(os.path.dirname(__file__), "rag.py")
    cmd = f'"{sys.executable}" "{script_path}" {req.video_id} "{req.question}"'
    end_time = time.time()
    print(f"Exe file making: {end_time - start_time:.4f} seconds")

    try:
        start_time = time.time()
        result = subprocess.run(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=40
        )
        end_time = time.time()
        print(f"Execution time: {end_time - start_time:.4f} seconds")
        print("📄 STDOUT:\n", result.stdout if result.stdout.strip() else "[no stdout]")
        print("⚠️ STDERR:\n", result.stderr if result.stderr.strip() else "[no stderr]")
        print("🔁 Return code:", result.returncode)

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Subprocess failed:\n{result.stderr}")

        try:
            answer_json = json.loads(result.stdout)
        except json.JSONDecodeError as json_err:
            raise HTTPException(status_code=500, detail=f"Invalid JSON output:\n{result.stdout}\nError: {json_err}")

        return answer_json

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="LLM response timed out.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unhandled error: {e}")



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

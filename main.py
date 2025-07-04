# main.py
from fastapi import FastAPI,Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import threading
import db
import download
import transcribe
import openai

# Set OpenAI key
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()
client=openai.AsyncOpenAI()
db.init_db()
VIDEO_DIR = "videos"
app.mount("/videos", StaticFiles(directory=VIDEO_DIR), name="videos")
# Global dictionary to track job progress
video_jobs = {}

# --- Models ---
class ImportRequest(BaseModel):
    user_id: int
    url: str

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class QueryRequest(BaseModel):
    video_id: int
    question: str

# --- Auth ---
@app.post("/signup")
def signup(req: SignupRequest):
    user = db.add_user(req.email, req.password)
    if user:
        return {"user_id": user}
    return {"error": "user already exists"}

@app.post("/login")
def login(req: LoginRequest):
    user = db.validate_user(req.email, req.password)
    if user:
        return {"user_id": user}
    return {"error": "Invalid credentials"}

# --- Import ---
def import_worker(user_id, url):
    video_jobs[url] = "Downloading"
    try:
        existing = db.get_video_by_url(url)
        if existing:
            db.link_user_video(user_id, existing["id"])
            video_jobs[url] = "Already exists"
        else:
            file_path,metadata = download.download_video(url)
            video_jobs[url] = "Transcribing"
            transcript = transcribe.transcribe_audio(file_path)
            video_id = db.add_video_record(url, file_path, transcript,metadata)
            db.link_user_video(user_id, video_id)
            video_jobs[url] = "Completed"
    except Exception as e:
        video_jobs[url] = f"Failed: {str(e)}"

@app.post("/import_video")
def import_video(req: ImportRequest):
    if req.url in video_jobs and video_jobs[req.url] not in ["Failed", "Completed"]:
        return {"message": "Video already being imported."}
    thread = threading.Thread(target=import_worker, args=(req.user_id, req.url))
    thread.start()
    return {"message": "Video import started"}

@app.get("/progress")
def get_progress():
    return video_jobs

@app.get("/videos")
def get_user_videos(user_id: int = Query(...)):
    try:
        videos = db.get_videos_for_user(user_id)
        result = [
            {
                "id": v["id"],
                "url": v["url"],
                "file_path": v["file_path"],
                "transcript": v["transcript"]
            }
            for v in videos
        ]
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
# --- Query ---
@app.post("/query")
def query_video(req: QueryRequest):
    transcript = db.get_transcript(req.video_id)
    if not transcript:
        return {"answer": "Transcript not found."}
    prompt = f"Transcript:\n{transcript}\n\nQuestion: {req.question}\nAnswer:"
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=256
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        return {"answer": f"Error: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

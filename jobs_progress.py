from threading import Lock
from typing import Dict, Any
import time,uuid
# Global state with lock
_video_jobs: Dict[str, Dict[str, Any]] = {}
_video_jobs_lock = Lock()

def create_job(url: str, user_id: int) -> str:
    """Create a new job entry in a thread-safe way."""
    job_id = str(uuid.uuid4())
    with _video_jobs_lock:
        _video_jobs[job_id] = {
            "url": url,
            "status": "Queued",
            "progress": 0,
            "message": "Waiting to start processing",
            "user_id": user_id,
            "created_at": time.time(),
            "last_updated": time.time()
        }
    return job_id

def get_job(job_id: str) -> Dict[str, Any]:
    """Get job details in a thread-safe way."""
    with _video_jobs_lock:
        return _video_jobs.get(job_id, None)

def update_job_progress(job_id: str, status: str, progress: int, message: str = ""):
    """Update job progress in a thread-safe way."""
    with _video_jobs_lock:
        if job_id in _video_jobs:
            _video_jobs[job_id].update({
                "status": status,
                "progress": progress,
                "message": message,
                "last_updated": time.time()
            })

def get_all_jobs() -> Dict[str, Dict[str, Any]]:
    """Get all jobs (for debugging)"""
    with _video_jobs_lock:
        return _video_jobs.copy()
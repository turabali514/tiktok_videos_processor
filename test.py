from create_vector_db import add_new_transcript

from concurrent.futures import ThreadPoolExecutor
from create_vector_db import add_new_transcript
import concurrent.futures
executor = concurrent.futures.ThreadPoolExecutor(max_workers=20)
def worker_task():
    try:
        transcript = "Test transcript content..."
        add_new_transcript(transcript, 699)
    except Exception as e:
        print(f"Worker failed: {e}")
executor.submit(worker_task)

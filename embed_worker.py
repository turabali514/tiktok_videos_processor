# embed_worker.py

from create_vector_db import add_new_transcript

def embed_transcript(transcript: str, video_id: int):
    print("📥 Embedding transcript...")
    add_new_transcript(transcript, video_id=video_id)
    print("✅ Transcript embedded successfully.")


# embed_worker.py
import os
from create_vector_db import add_new_transcript

if __name__ == "__main__":
    text_path = os.environ.get("EMBED_TEXT_PATH")
    video_id = os.environ.get("VIDEO_ID")

    if not text_path or not os.path.exists(text_path):
        print("❌ Transcript file not found.")
        exit(1)

    if not video_id:
        print("❌ VIDEO_ID not set.")
        exit(1)

    with open(text_path, "r", encoding="utf-8") as f:
        transcript = f.read()

    print("📥 Embedding transcript...")
    add_new_transcript(transcript, video_id=int(video_id))
    print("✅ Transcript embedded successfully.")

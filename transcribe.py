import openai
import os
import tempfile
from pydub import AudioSegment
from moviepy import VideoFileClip
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# === Settings ===
CHUNK_DURATION_MS = 5 * 60 * 1000  # 5 minutes per chunk (adjustable)

def extract_audio(video_path, output_format="mp3"):
    """Extract audio from video and return path to audio file."""
    video = VideoFileClip(video_path)
    audio_path = tempfile.mktemp(suffix=f".{output_format}")
    video.audio.write_audiofile(audio_path, bitrate="64k")
    return audio_path

def split_audio(audio_path, chunk_duration_ms):
    """Split audio into chunks under the given duration (ms)."""
    audio = AudioSegment.from_file(audio_path)
    chunks = []
    for i in range(0, len(audio), chunk_duration_ms):
        chunk = audio[i:i+chunk_duration_ms]
        temp_chunk_path = tempfile.mktemp(suffix=".mp3")
        chunk.export(temp_chunk_path, format="mp3", bitrate="64k")
        chunks.append(temp_chunk_path)
    return chunks

def transcribe_chunk(file_path):
    """Transcribe a single audio chunk."""
    with open(file_path, "rb") as f:
        response = openai.audio.transcriptions.create(model="whisper-1", file=f)
    return response.text

def transcribe_audio(video_path):
    """Full pipeline: extract, split, transcribe, combine."""
    print("Extracting audio...")
    audio_path = extract_audio(video_path)
    
    print("Splitting audio into chunks...")
    chunks = split_audio(audio_path, CHUNK_DURATION_MS)
    
    print(f"Transcribing {len(chunks)} chunks...")
    full_transcript = ""
    for i, chunk_path in enumerate(chunks):
        print(f"Transcribing chunk {i+1}/{len(chunks)}...")
        try:
            chunk_text = transcribe_chunk(chunk_path)
            full_transcript += chunk_text + "\n"
        except Exception as e:
            print(f"Error transcribing chunk {i+1}: {e}")
    os.remove(audio_path)
    return full_transcript.strip()

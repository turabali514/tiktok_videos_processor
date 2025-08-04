import openai
import os
import tempfile
from pydub import AudioSegment
from moviepy import VideoFileClip
from utils.utils import get_settings, get_logger

# Initialize settings and logger
settings = get_settings()
logger = get_logger(settings.LOGS_PATH)

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

# === Settings ===
CHUNK_DURATION_MS = settings.get("CHUNK_DURATION_MS", 5 * 60 * 1000)  # 5 minutes per chunk (default)
TEMP_DIR = settings.get("TEMP_DIR", "./videos/temp")
AUDIO_BITRATE = settings.get("AUDIO_BITRATE", "64k")
WHISPER_MODEL = settings.get("WHISPER_MODEL", "whisper-1")

def extract_audio(video_path, output_format="mp3"):
    """Extract audio from video and return path to audio file."""
    try:
        logger.info(f"Extracting audio from video: {video_path}")
        video = VideoFileClip(video_path)
        os.makedirs(TEMP_DIR, exist_ok=True)
        audio_path = tempfile.mktemp(suffix=f".{output_format}", dir=TEMP_DIR)
        
        logger.debug(f"Writing audio to temporary file: {audio_path}")
        video.audio.write_audiofile(audio_path, bitrate=AUDIO_BITRATE)
        logger.info(f"Successfully extracted audio to: {audio_path}")
        return audio_path
    except Exception as e:
        logger.error(f"Error extracting audio from {video_path}: {str(e)}", exc_info=True)
        raise

def split_audio(audio_path, chunk_duration_ms):
    """Split audio into chunks under the given duration (ms)."""
    try:
        logger.info(f"Splitting audio file: {audio_path}")
        logger.debug(f"Loading audio file: {audio_path}")
        audio = AudioSegment.from_file(audio_path)
        logger.debug(f"Audio duration: {len(audio)}ms, splitting into chunks of {chunk_duration_ms}ms")
        
        chunks = []
        for i in range(0, len(audio), chunk_duration_ms):
            logger.debug(f"Processing chunk starting at {i}ms")
            chunk = audio[i:i+chunk_duration_ms]
            temp_chunk_path = tempfile.mktemp(suffix=".mp3", dir=TEMP_DIR)
            chunk.export(temp_chunk_path, format="mp3", bitrate=AUDIO_BITRATE)
            chunks.append(temp_chunk_path)
            logger.debug(f"Created chunk at: {temp_chunk_path}")
        
        logger.info(f"Split audio into {len(chunks)} chunks")
        return chunks
    except Exception as e:
        logger.error(f"Error splitting audio file {audio_path}: {str(e)}", exc_info=True)
        raise

def transcribe_chunk(file_path):
    """Transcribe a single audio chunk."""
    try:
        logger.debug(f"Transcribing chunk: {file_path}")
        with open(file_path, "rb") as f:
            response = openai.audio.transcriptions.create(
                model=WHISPER_MODEL, 
                file=f
            )
        logger.debug(f"Completed transcription for chunk: {file_path}")
        return response.text
    except Exception as e:
        logger.error(f"Error transcribing chunk {file_path}: {str(e)}", exc_info=True)
        raise

def transcribe_audio(video_path):
    """Full pipeline: extract, split, transcribe, combine."""
    try:
        logger.info(f"Starting transcription pipeline for: {video_path}")
        
        # Extract audio
        audio_path = extract_audio(video_path)
        
        # Split audio
        chunks = split_audio(audio_path, CHUNK_DURATION_MS)
        
        # Transcribe chunks
        full_transcript = ""
        logger.info(f"Beginning transcription of {len(chunks)} chunks")
        
        for i, chunk_path in enumerate(chunks, 1):
            logger.info(f"Processing chunk {i}/{len(chunks)}")
            try:
                chunk_text = transcribe_chunk(chunk_path)
                full_transcript += chunk_text + "\n"
                # Clean up chunk file immediately after processing
                os.remove(chunk_path)
                logger.debug(f"Removed temporary chunk file: {chunk_path}")
            except Exception as e:
                logger.error(f"Failed to transcribe chunk {i}: {str(e)}")
                continue  # Continue with next chunk even if one fails
        
        # Clean up audio file
        os.remove(audio_path)
        logger.debug(f"Removed temporary audio file: {audio_path}")
        
        logger.info(f"Completed transcription for: {video_path}")
        logger.debug(f"Transcript length: {len(full_transcript)} characters")
        
        return full_transcript.strip()
    except Exception as e:
        logger.error(f"Transcription pipeline failed for {video_path}: {str(e)}", exc_info=True)
        raise
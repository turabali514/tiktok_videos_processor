# transcribe.py
import openai
import os
from dotenv import load_dotenv


load_dotenv()
def transcribe_audio(file_path):
    """
    Transcribe the audio in the given video file using OpenAI Whisper.
    Returns the transcript text.
    """
    
    try:
        # Open video file in binary mode
        audio_file = open(file_path, "rb")
        print(audio_file)
        # Call the Whisper-1 model via OpenAI API
        result = openai.audio.transcriptions.create(model="whisper-1", file=audio_file)
        print(result)
        text = result.text
    except Exception as e:
        print(f"Transcription error: {e}")
        text = ""
    return text

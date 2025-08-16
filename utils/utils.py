import logging
import os
import sys
import tempfile
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
from dynaconf import Dynaconf

def get_settings() -> Dynaconf:
    load_dotenv()
    settings = Dynaconf(
        environments=True,
        settings_files=[".secrets.toml"],
    )
    settings.from_env("default")
    return settings

def ensure_log_directory(logs_path: str) -> str:
    """Ensure log directory exists and is writable, with fallbacks"""
    try:
        # Try the configured path first
        os.makedirs(logs_path, exist_ok=True)
        test_file = os.path.join(logs_path, 'permission_test.tmp')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        return logs_path
    except PermissionError:
        # Fallback 1: Try project-relative directory
        project_logs = os.path.join(os.getcwd(), 'logs')
        try:
            os.makedirs(project_logs, exist_ok=True)
            return project_logs
        except Exception:
            # Fallback 2: Use system temp directory
            temp_logs = os.path.join(tempfile.gettempdir(), 'tiktok_processor_logs')
            os.makedirs(temp_logs, exist_ok=True)
            return temp_logs

def get_logger(logs_path: str) -> logging.Logger:
    """Get logger with proper permission handling"""
    logger = logging.getLogger("bot_logger")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        # Determine the actual log directory to use
        log_dir = ensure_log_directory(os.path.dirname(logs_path))
        current_script = os.path.splitext(os.path.basename(sys.argv[0]))[0]
        final_log_path = os.path.join(log_dir, f"{current_script}.log")

        try:
            # File handler with rotation
            file_handler = RotatingFileHandler(
                final_log_path,
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            )
            formatter = logging.Formatter(
                "%(asctime)s - %(levelname)s - [%(process)d] - %(filename)s - %(funcName)s - %(message)s"
            )
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except PermissionError as e:
            print(f"Warning: Could not create log file at {final_log_path}: {e}")
            print("Falling back to console logging only")

        # Always add console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger
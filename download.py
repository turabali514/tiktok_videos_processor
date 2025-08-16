import time
import os
import pandas as pd
import requests
from utils.utils import get_settings, get_logger
import utils.pyktok_patch

# Initialize settings and logger
settings = get_settings()
logger = get_logger(settings.LOGS_PATH)

def download_video(url, save_dir='videos'):
    """
    Download a TikTok video and its metadata using pyktok with proxy support.
    
    Args:
        url (str): TikTok video URL
        save_dir (str): Directory to save the video and metadata
        
    Returns:
        tuple: (video_file_path, metadata_dict)
    """
    try:
        # Configure proxy from settings
        proxy = settings.get('PROXY')
        proxy_auth = settings.get('PROXY_AUTH')
        
        proxies = {
            "https": f"http://{proxy_auth}@{proxy}"
        } if proxy and proxy_auth else None

        # Test proxy connection
        if proxies:
            logger.info(f"Testing proxy connection to {proxy}")
            try:
                response = requests.get("https://ipv4.icanhazip.com", 
                                     proxies=proxies, 
                                     timeout=settings.get('PROXY_TIMEOUT', 10))
                logger.debug(f"Proxy test successful. Current IP: {response.text.strip()}")
            except requests.exceptions.RequestException as e:
                logger.error(f"Proxy test failed: {str(e)}")
                raise ConnectionError("Proxy connection failed")

        # Ensure save directory exists
        os.makedirs(save_dir, exist_ok=True)
        logger.info(f"Downloading TikTok video from {url}")
        logger.debug(f"Save directory: {save_dir}")

        # Download video and metadata
        result = utils.pyktok_patch.save_tiktok(
            url,
            save_video=True,
            metadata_fn="tiktok_data.csv",
            save_dir=save_dir,
            proxies=proxies
        )

        # Rate limiting
        sleep_time = settings.get('DOWNLOAD_DELAY', 1)
        logger.debug(f"Sleeping for {sleep_time} seconds between downloads")
        time.sleep(sleep_time)

        # Find downloaded video file
        files = [
            os.path.join(save_dir, f)
            for f in os.listdir(save_dir)
            if f.endswith('.mp4')
        ]
        
        if not files:
            error_msg = f"No .mp4 files found in {save_dir}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        
        latest_file = max(files, key=os.path.getctime)
        logger.info(f"Downloaded video saved to: {latest_file}")

        # Get metadata
        metadata_path = os.path.join(save_dir, "tiktok_data.csv")
        if not os.path.exists(metadata_path):
            error_msg = f"Metadata file not found at {metadata_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        metadata_df = pd.read_csv(metadata_path)
        last_metadata = metadata_df.iloc[-1].to_dict()
        logger.debug("Retrieved video metadata", extra={"metadata": last_metadata})

        return latest_file, last_metadata

    except Exception as e:
        logger.error(f"Failed to download video from {url}: {str(e)}", exc_info=True)
        raise
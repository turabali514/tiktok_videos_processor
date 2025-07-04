# download.py
import time,os
import pandas as pd
import utils.pyktok_patch 
# Specify the browser for pyktok (Edge in this case



def download_video(url,save_dir='videos'):
    """
    Download a TikTok video from the given URL.
    Returns the local file path of the saved video and meta data.
    """
    metadata_path = os.path.join(save_dir, "/tiktok_data.csv")
    
    result = utils.pyktok_patch.save_tiktok(url, save_video=True, metadata_fn=metadata_path,save_dir=save_dir)
    time.sleep(1)
    
    files = [
        os.path.join(save_dir, f)
        for f in os.listdir(save_dir)
        if f.endswith('.mp4')
    ]
    if not files:
        raise FileNotFoundError("No .mp4 files found in save_dir")
    
    latest_file = max(files, key=os.path.getctime)
    
    # Read last metadata row
    metadata_df = pd.read_csv(metadata_path)
    last_metadata = metadata_df.iloc[-1].to_dict()
    
    return latest_file, last_metadata

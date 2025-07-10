# download.py
import time,os
import pandas as pd
import utils.pyktok_patch 
import requests
# Specify the browser for pyktok (Edge in this case

proxy = os.environ.get('proxy')
proxy_auth = os.environ.get('proxy_auth')

def download_video(url, save_dir='videos'):
    
    proxies = {
        "https": f"http://{proxy_auth}@{proxy}"
    }
    try:
        response = requests.get("https://ipv4.icanhazip.com", proxies=proxies, timeout=10)
    except requests.exceptions.RequestException as e:
        print("Request failed:", e)
    result = utils.pyktok_patch.save_tiktok(
        url,
        save_video=True,
        metadata_fn="tiktok_data.csv",
        save_dir=save_dir,
        proxies=proxies
    )
    time.sleep(1)
    files = [
        os.path.join(save_dir, f)
        for f in os.listdir(save_dir)
        if f.endswith('.mp4')
    ]
    if not files:
        raise FileNotFoundError("No .mp4 files found in save_dir")
    
    latest_file = max(files, key=os.path.getctime)
    metadata_df = pd.read_csv(os.path.join(save_dir, "tiktok_data.csv"))
    last_metadata = metadata_df.iloc[-1].to_dict()
    return latest_file, last_metadata
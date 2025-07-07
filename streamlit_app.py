# streamlit_app.py
import streamlit as st
import requests
import time
import os

st.set_page_config(layout="wide")
st.title("TikTok Insights App")

# --- Session Setup ---
if 'user_id' not in st.session_state:
    st.session_state.user_id = None
    st.session_state.mode = 'login'
    st.session_state.email = None
if 'import_status' not in st.session_state:
    st.session_state.import_status = {}
if 'selected_video' not in st.session_state:
    st.session_state.selected_video = None

def switch_mode():
    st.session_state.mode = 'signup' if st.session_state.mode == 'login' else 'login'

# --- Authentication UI ---
if st.session_state.user_id is None:
    st.subheader("Sign Up" if st.session_state.mode == 'signup' else "Login")
    email_input = st.text_input("Email")
    password_input = st.text_input("Password", type="password")
    action_btn = "Create Account" if st.session_state.mode == 'signup' else "Login"

    if st.button(action_btn, key="auth_button"):
        endpoint = "/signup" if st.session_state.mode == 'signup' else "/login"
        try:
            res = requests.post(f"http://127.0.0.1:8000{endpoint}",
                                json={"email": email_input, "password": password_input})
            data = res.json()
            if res.status_code == 200 and 'user_id' in data:
                st.session_state.user_id = data["user_id"]
                st.session_state.email = email_input
                st.success("Logged in!" if st.session_state.mode == 'login' else "Account created!")
                st.rerun()
            else:
                st.error(data.get("error", "Something went wrong"))
        except Exception as e:
            st.error(f"Auth error: {e}")

    if st.button("Switch to " + ("Login" if st.session_state.mode == 'signup' else "Sign Up"), key="switch_mode"):
        switch_mode()
        st.rerun()
        
    st.stop()

# --- Sidebar Logout ---
st.sidebar.write(f"Logged in as {st.session_state.email}")
if st.sidebar.button("Logout"):
    for key in list(st.session_state.keys()):
        del st.session_state[key]
    st.rerun()

# --- Show Selected Video Detail Page ---
if st.session_state.selected_video:
    selected_id = st.session_state.selected_video
    st.header("🎬 Video Details")

    try:
        resp = requests.get("http://127.0.0.1:8000/videos", params={"user_id": st.session_state.user_id})
        if resp.status_code == 200:
            videos = resp.json()
            video = next((v for v in videos if v['id'] == selected_id), None)

            if video:
                st.video(video['file_path'])

                st.subheader("📝 Transcript")
                st.write(video['transcript'])

                st.subheader("📊 Stats (Mocked)")
                st.write("👁️ Views: 10.5k | ❤️ Likes: 1.2k | 💬 Comments: 87")

                st.subheader("💬 Ask About This Video")
                q = st.text_input("Ask your question")
                if st.button("Get Answer"):
                    res = requests.post("http://127.0.0.1:8000/query", json={
                        "video_id": selected_id,
                        "question": q
                    })
                    if res.status_code == 200:
                        st.success(res.json().get("answer", "No response"))
                    else:
                        st.error("Failed to get answer.")
        else:
            st.error("Could not fetch videos.")
    except Exception as e:
        st.error(f"Error loading detail page: {e}")

    if st.button("⬅ Back to Videos"):
        del st.session_state.selected_video
        st.rerun()

    st.stop()

# --- Import UI ---
st.header("Import a TikTok Video")
url_input = st.text_input("TikTok Video URL")

if st.button("Import Video", key="import") and url_input:
    payload = {"user_id": st.session_state.user_id, "url": url_input}
    try:
        res = requests.post("http://127.0.0.1:8000/import_video", json=payload)
        msg = res.json().get("message", "Unknown response")
        st.info(msg)
        st.session_state.import_status[url_input] = "Downloading"
    except Exception as e:
        st.error(f"Import error: {e}")

# --- Progress UI ---
progress_placeholder = st.empty()

def render_progress():
    with progress_placeholder.container():
        st.subheader("Current Import Jobs")
        for url, status in st.session_state.import_status.items():
            short_url = url if len(url) <= 60 else url[:57] + "..."
            st.markdown(f"- `{short_url}` → **{status}**")

if any(status not in ["Completed", "Failed", "Already exists"] for status in st.session_state.import_status.values()):
    if st.button("🔄 Refresh Import Status"):
        try:
            response = requests.get("http://127.0.0.1:8000/progress")
            if response.status_code == 200:
                backend_progress = response.json()
                for url in st.session_state.import_status.keys():
                    if url in backend_progress:
                        st.session_state.import_status[url] = backend_progress[url]
                render_progress()
            else:
                st.error("Failed to fetch progress.")
        except Exception as e:
            st.error(f"Progress polling error: {e}")
else:
    render_progress()

# --- Video Gallery UI ---
st.header("Your Videos")

try:
    resp = requests.get("http://127.0.0.1:8000/videos", params={"user_id": st.session_state.user_id})
    if resp.status_code == 200:
        videos = resp.json()
        cols = st.columns(3)

        for i, vid in enumerate(videos):
            with cols[i % 3]:
                st.video(vid['file_path'], format="video/mp4", start_time=0)
                st.caption(f"Video ID: {vid['id']}")
                if st.button("🔍 View Details", key=f"btn_{vid['id']}"):
                    st.session_state.selected_video = vid['id']
                    st.rerun()
    else:
        st.error("Could not fetch video list.")
except Exception as e:
    st.error(f"Error retrieving videos: {e}")

import streamlit as st
import requests
from utils.nav import nav_bar

st.set_page_config(layout="wide")

# Fade-in animation
st.markdown("""
    <style>
    .fade-in {
        animation: fadeIn 0.4s ease-in-out;
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    </style>
    <div class="fade-in">
""", unsafe_allow_html=True)

# Routing via query params
query_params = st.query_params
st.session_state.page = query_params.get("page", "login")

# Session state
if 'user_id' not in st.session_state:
    st.session_state.user_id = None
    st.session_state.email = None
if 'import_status' not in st.session_state:
    st.session_state.import_status = {}
if 'selected_video' not in st.session_state:
    st.session_state.selected_video = None

# Show nav only if authenticated
if st.session_state.page not in ["login", "signup"]:
    nav_bar()
    st.markdown(f"#### 👋 Welcome, **{st.session_state.email}**")

# --- Login Page ---
if st.session_state.page == "login":
    st.title("🔐 Login")
    email_input = st.text_input("Email")
    password_input = st.text_input("Password", type="password")

    if st.button("Login"):
        try:
            res = requests.post("http://127.0.0.1:8000/login", json={
                "email": email_input, "password": password_input
            })
            data = res.json()
            if res.status_code == 200 and 'user_id' in data:
                st.session_state.user_id = data["user_id"]
                st.session_state.email = email_input
                st.success("Logged in!")
                st.query_params.update({"page": "dashboard"})
                st.rerun()
            else:
                st.error(data.get("error", "Login failed"))
        except Exception as e:
            st.error(f"Auth error: {e}")

    st.markdown("Don't have an account? [Sign up](?page=signup)")

# --- Signup Page ---
elif st.session_state.page == "signup":
    st.title("📝 Sign Up")
    email_input = st.text_input("Email")
    password_input = st.text_input("Password", type="password")

    if st.button("Create Account"):
        try:
            res = requests.post("http://127.0.0.1:8000/signup", json={
                "email": email_input, "password": password_input
            })
            data = res.json()
            if res.status_code == 200 and 'user_id' in data:
                st.success("Account created! Please log in.")
                st.query_params.update({"page": "login"})
                st.rerun()
            else:
                st.error(data.get("error", "Signup failed"))
        except Exception as e:
            st.error(f"Signup error: {e}")

    st.markdown("Already have an account? [Login](?page=login)")

# --- Dashboard Page ---
elif st.session_state.page == "dashboard":
    if not st.session_state.user_id:
        st.warning("Please login first.")
        st.query_params.update({"page": "login"})
        st.rerun()

    st.title("📥 TikTok Insights Dashboard")

    # Import UI
    st.header("Import a TikTok Video")
    url_input = st.text_input("TikTok Video URL")
    if st.button("Import Video") and url_input:
        payload = {"user_id": st.session_state.user_id, "url": url_input}
        try:
            res = requests.post("http://127.0.0.1:8000/import_video", json=payload)
            msg = res.json().get("message", "Unknown response")
            st.info(msg)
            st.session_state.import_status[url_input] = "Downloading"
        except Exception as e:
            st.error(f"Import error: {e}")

    # Progress UI
    progress_placeholder = st.empty()
    def render_progress():
        with progress_placeholder.container():
            st.subheader("Current Import Jobs")
            for url, status in st.session_state.import_status.items():
                short_url = url if len(url) <= 60 else url[:57] + "..."
                st.markdown(f"- `{short_url}` → **{status}**")

    if any(s not in ["Completed", "Failed", "Already exists"] for s in st.session_state.import_status.values()):
        if st.button("🔄 Refresh Import Status"):
            try:
                res = requests.get("http://127.0.0.1:8000/progress")
                if res.status_code == 200:
                    progress = res.json()
                    for url in st.session_state.import_status:
                        if url in progress:
                            st.session_state.import_status[url] = progress[url]
            except Exception as e:
                st.error(f"Progress polling error: {e}")

    render_progress()

    # Video Gallery
    st.header("Your Videos")
    try:
        resp = requests.get("http://127.0.0.1:8000/videos", params={"user_id": st.session_state.user_id})
        if resp.status_code == 200:
            videos = resp.json()
            cols = st.columns(3)
            for i, vid in enumerate(videos):
                with cols[i % 3]:
                    st.video(vid['file_path'])
                    st.caption(f"Video ID: {vid['id']}")
                    if st.button("🔍 View Details", key=f"vid_{vid['id']}"):
                        st.session_state.selected_video = vid['id']
                        st.query_params.update({"page": "video"})
                        st.rerun()
        else:
            st.error("Could not fetch videos.")
    except Exception as e:
        st.error(f"Error retrieving videos: {e}")

# --- Video Detail Page ---
elif st.session_state.page == "video":
    selected_id = st.session_state.selected_video
    if not selected_id:
        st.warning("No video selected.")
        st.query_params.update({"page": "dashboard"})
        st.rerun()

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

                st.subheader("📊 Stats")
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
        st.query_params.update({"page": "dashboard"})
        del st.session_state.selected_video
        st.rerun()

st.markdown("</div>", unsafe_allow_html=True)

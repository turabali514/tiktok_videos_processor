import streamlit as st
import requests
# --- Page Config ---
st.set_page_config(page_title="TikTok Insights", layout="wide", page_icon="🎵")

# --- Session Setup ---
default_session_state = {
    'user_id': None,
    'email': None,
    'import_status': {},
    'selected_video': None,
    'theme': 'light',
    'video_data_cache': [],
}

for key, default_value in default_session_state.items():
    if key not in st.session_state or st.session_state[key] is None:
        st.session_state[key] = default_value
params = st.query_params
if (
    st.session_state.user_id is None
    and "user_id" in params
    and "email" in params
):
    st.session_state.user_id = params["user_id"]
    st.session_state.email = params["email"]

    # Optional: prefetch videos if cache is empty
    if not st.session_state.video_data_cache:
        try:
            videos_res = requests.get("http://127.0.0.1:8000/videos", params={"user_id": st.session_state.user_id})
            if videos_res.status_code == 200:
                st.session_state.video_data_cache = videos_res.json()
        except Exception as e:
            st.error(f"❌ Error restoring videos from session: {e}")

# --- Theme Toggle ---
if st.session_state.theme is None:
    st.session_state.theme = "light"
theme_label = "🌙 Dark Mode" if st.session_state.theme == "light" else "☀️ Light Mode"
if st.sidebar.button(theme_label):
    st.session_state.theme = "dark" if st.session_state.theme == "light" else "light"
    st.rerun()

# --- Logout Button ---
if st.session_state.user_id:
    if st.sidebar.button("🚪 Logout"):
        for key in ['user_id', 'email', 'import_status', 'selected_video', 'video_data_cache']:
            st.session_state[key] = None
        st.query_params.clear()
        st.rerun()

# --- Theme CSS ---
theme_css = {
    "dark": """
    <style>
    body, .stApp { 
        background: linear-gradient(135deg, #0f1117 0%, #1a1c25 100%); 
        color: #f1f1f1; 
    }
    h1, h2, h3 {
        background: linear-gradient(90deg, #ffcc70, #c850c0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }
    .stButton>button {
        background: linear-gradient(90deg, #fc6076, #ff9a44);
        color: white;
        border-radius: 10px;
        padding: 8px 16px;
        border: none;
        box-shadow: 0 4px 12px rgba(252, 96, 118, 0.3);
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 7px 15px rgba(252, 96, 118, 0.4);
    }
    .divider { 
        border-bottom: 2px solid #444; 
        margin: 1.8rem 0; 
    }
    .video-card {
        background: linear-gradient(135deg, #1c1e26 0%, #252836 100%);
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s, box-shadow 0.3s;
        margin-bottom: 25px;
        border-left: 4px solid #fc6076;
    }
    .video-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 25px rgba(252, 96, 118, 0.2);
    }
    .video-bubble {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: linear-gradient(135deg, #1c1e26 0%, #252836 100%);
        padding: 22px;
        margin-bottom: 28px;
        border-radius: 20px;
        border-left: 4px solid #fc6076;
        border-right: 4px solid #ff9a44;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .video-bubble:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(252, 96, 118, 0.25);
    }
    .video-bubble video {
        width: 100%;
        border-radius: 12px;
        margin-bottom: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    .video-bubble .stats {
        font-size: 14px;
        margin: 6px 0;
        color: #ffcc70;
        text-align: center;
    }
    .video-bubble .stats a {
        color: #ff9a44;
        text-decoration: none;
        transition: color 0.2s;
    }
    .video-bubble .stats a:hover {
        color: #fc6076;
        text-decoration: underline;
    }
    </style>
    """,
    "light": """
    <style>
    body, .stApp { 
        background: linear-gradient(135deg, #f4f7fb 0%, #ffffff 100%); 
        color: #333; 
    }
    h1, h2, h3 {
        background: linear-gradient(90deg, #0072ff, #00c6ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }
    .stButton>button {
        background: linear-gradient(90deg, #0072ff, #00c6ff);
        color: white;
        border-radius: 10px;
        padding: 8px 16px;
        border: none;
        box-shadow: 0 4px 12px rgba(0, 114, 255, 0.2);
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 7px 15px rgba(0, 114, 255, 0.3);
    }
    .divider { 
        border-bottom: 2px solid #e0e0e0; 
        margin: 1.8rem 0; 
    }
    .video-card {
        background: linear-gradient(135deg, #ffffff 0%, #f4f7fb 100%);
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 8px 20px rgba(0, 114, 255, 0.1);
        transition: transform 0.3s, box-shadow 0.3s;
        margin-bottom: 25px;
        border-left: 4px solid #0072ff;
    }
    .video-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 25px rgba(0, 114, 255, 0.15);
    }
    .video-bubble {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: linear-gradient(135deg, #ffffff 0%, #f4f7fb 100%);
        padding: 22px;
        margin-bottom: 28px;
        border-radius: 20px;
        border-left: 4px solid #0072ff;
        border-right: 4px solid #00c6ff;
        box-shadow: 0 10px 25px rgba(0, 114, 255, 0.1);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .video-bubble:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0, 114, 255, 0.2);
    }
    .video-bubble video {
        width: 100%;
        border-radius: 12px;
        margin-bottom: 15px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .video-bubble .stats {
        font-size: 14px;
        margin: 6px 0;
        color: #0072ff;
        text-align: center;
    }
    .video-bubble .stats a {
        color: #00c6ff;
        text-decoration: none;
        transition: color 0.2s;
    }
    .video-bubble .stats a:hover {
        color: #0072ff;
        text-decoration: underline;
    }
    </style>
    """
}

st.markdown(theme_css[st.session_state.theme], unsafe_allow_html=True)

# --- App Container ---
st.markdown("""
<div style="max-width: 1200px; margin: auto; padding: 20px;">
""", unsafe_allow_html=True)

if st.session_state.user_id:
    greeting = f"Welcome, {st.session_state.email.split('@')[0].capitalize()} 👋"
    st.markdown(f"""
    <div style="text-align: center; padding: 1rem; background: rgba(0,0,0,0.05); border-radius: 12px; ">
        <h2 style="margin: 0;">{greeting}</h2>
    </div>
    """, unsafe_allow_html=True)

# --- Routing ---
page = st.query_params.get("page", "login")
# if st.session_state.user_id:
#     nav_bar()
if st.query_params.get("page") == "login" and st.session_state.user_id:
    st.session_state.user_id = None
    st.session_state.email = None
    st.session_state.import_status = {}
    st.session_state.selected_video = None
    st.success("🔓 You have been logged out.")
# --- Login Page ---
if page == "login":
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
        <div style="text-align: center; padding: 30px 0;">
            <h1 style="font-size: 2.5rem; margin-bottom: 30px;">🔐 Login to TikTok Insights</h1>
        </div>
        """, unsafe_allow_html=True)
        
        login_container = """
        <div style="background: linear-gradient(135deg, #ffffff 0%, #f4f7fb 100%); 
                   padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 114, 255, 0.15);
                   border-left: 4px solid #0072ff; border-right: 4px solid #00c6ff; margin-bottom: 30px;">
        """
        
        if st.session_state.theme == "dark":
            login_container = """
            <div style="background: linear-gradient(135deg, #1c1e26 0%, #252836 100%); 
                       padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                       border-left: 4px solid #fc6076; border-right: 4px solid #ff9a44; margin-bottom: 30px;">
            """
            
        st.markdown(login_container, unsafe_allow_html=True)
        
        email = st.text_input("✉️ Email", key="email_input")
        password = st.text_input("🔒 Password", type="password", key="password_input")
        
        login_btn = st.button("🚀 Login", use_container_width=True)
        
        st.markdown("</div>", unsafe_allow_html=True)
        
        if login_btn:
            with st.spinner("Authenticating..."):
                try:
                    res = requests.post("http://127.0.0.1:8000/login", json={"email": email, "password": password})
                    data = res.json()
                    if res.status_code == 200 and 'user_id' in data:
                        st.session_state.user_id = data["user_id"]
                        st.session_state.email = email
                        st.query_params.update({
        "page": "dashboard",
        "user_id": data["user_id"],
        "email": email
    })
                        try:
                            videos_res = requests.get("http://127.0.0.1:8000/videos", params={"user_id": data["user_id"]})
                            if videos_res.status_code == 200:
                                st.session_state.video_data_cache = videos_res.json()
                        except Exception as e:
                            st.error(f"❌ Error fetching videos after login: {e}")
                        st.balloons()
                        st.success("🎉 Login successful!")
                        st.query_params.update({"page": "dashboard"})
                        st.rerun()
                    else:
                        st.error(data.get("error", "Login failed. Please check your credentials."))
                except Exception as e:
                    st.error(f"❌ Login error: {e}")
        
        st.markdown("""
        <div style="text-align:center; margin-top: 30px;">
            <form action="" method="get">
                <input type="hidden" name="page" value="signup" />
                <button type="submit" style="
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                ">
                    <span style="color: black;">👉 Don't have an account? </span>
                    <span style="color: #0072ff; font-weight: bold; text-decoration: none;">
                        Sign up here
                    </span>
                </button>
            </form>
        </div>
        """, unsafe_allow_html=True)



# --- Signup Page ---
elif page == "signup":
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
        <div style="text-align: center; padding: 30px 0;">
            <h1 style="font-size: 2.5rem; margin-bottom: 30px;">📝 Create Account</h1>
        </div>
        """, unsafe_allow_html=True)

        signup_container = """
        <div style="background: linear-gradient(135deg, #ffffff 0%, #f4f7fb 100%); 
                   padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 114, 255, 0.15);
                   border-left: 4px solid #0072ff; border-right: 4px solid #00c6ff; margin-bottom: 30px;">
        """

        if st.session_state.theme == "dark":
            signup_container = """
            <div style="background: linear-gradient(135deg, #1c1e26 0%, #252836 100%); 
                       padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                       border-left: 4px solid #fc6076; border-right: 4px solid #ff9a44; margin-bottom: 30px;">
            """

        st.markdown(signup_container, unsafe_allow_html=True)

        email = st.text_input("✉️ Email", key="signup_email")
        password = st.text_input("🔒 Password", type="password", key="signup_password")
        password_confirm = st.text_input("🔒 Confirm Password", type="password", key="signup_password_confirm")

        signup_btn = st.button("🚀 Create Account", use_container_width=True)

        st.markdown("</div>", unsafe_allow_html=True)

        if signup_btn:
            with st.spinner("Creating your account..."):
                if password != password_confirm:
                    st.error("❌ Passwords do not match!")
                else:
                    try:
                        res = requests.post("http://127.0.0.1:8000/signup", json={"email": email, "password": password})
                        if res.status_code == 200:
                            data = res.json()
                            if 'user_id' in data:
                                st.balloons()
                                st.success("🎉 Account created successfully!")
                                st.query_params.update({"page": "login"})
                                st.rerun()
                            elif 'error' in data:
                                st.error(f"❌ {data['error']}")
                        elif res.status_code == 422:
                            # FastAPI validation error (e.g., bad email or password format)
                            errors = res.json().get("detail", [])
                            for err in errors:
                                loc = " ➤ ".join([str(x) for x in err.get("loc", []) if x != "body"])
                                msg = err.get("msg", "Validation error")
                                st.error(f"❌ {loc}: {msg}")
                        else:
                            st.error("❌ Signup failed. Email may already be registered.")
                    except Exception as e:
                        st.error(f"❌ Signup error: {e}")


        st.markdown("""
        <div style="text-align:center; margin-top: 30px;">
            <form action="" method="get">
                <input type="hidden" name="page" value="login" />
                <button type="submit" style="
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                ">
                    <span style="color: black;">🔙 Already have an account? </span>
                    <span style="color: #0072ff; font-weight: bold; text-decoration: none;">
                        Login here
                    </span>
                </button>
            </form>
        </div>
        """, unsafe_allow_html=True)

# --- Dashboard ---
elif page == "dashboard":
    st.markdown("""
    <div style="text-align: center; padding: 20px 0;">
        <h1 style="font-size: 2.5rem; margin-bottom: 20px;">📥 TikTok Video Insights</h1>
        <p style="font-size: 1.2rem; margin-bottom: 30px;">Import and analyze your TikTok videos</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Create an attractive import card
    import_card_bg = "#1c1e26" if st.session_state.theme == "dark" else "#ffffff"
    import_card_border = "#fc6076" if st.session_state.theme == "dark" else "#0072ff"
    import_card_border2 = "#ff9a44" if st.session_state.theme == "dark" else "#00c6ff"
    
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, {import_card_bg} 0%, {import_card_bg} 100%); 
               padding: 25px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
               border-left: 4px solid {import_card_border}; border-right: 4px solid {import_card_border2}; 
               margin-bottom: 30px;">
        <h2 style="text-align: center; margin-bottom: 20px;">➕ Import a TikTok Video</h2>
    </div>
    """, unsafe_allow_html=True)
    
    url_input = st.text_input("🔗 Paste TikTok Video URL", placeholder="https://www.tiktok.com/@username/video/1234567890123456789")
    col1, col2, col3 = st.columns([1,1,1])
    with col2:
        import_btn = st.button("🚀 Import Video", use_container_width=True)
        
    if import_btn and url_input:
        with st.spinner("Processing your import request..."):
            payload = {"user_id": st.session_state.user_id, "url": url_input}
            try:
                res = requests.post("http://127.0.0.1:8000/import_video", json=payload)
                data = res.json()

                msg = data.get("message", "Import started!")
                clean_url = data.get("clean_url")
                video_id = data.get("video_id")

                # Track download status
                st.session_state.import_status[clean_url] = "Downloading"

                # Track the video ID for that URL
                if "import_video_ids" not in st.session_state:
                    st.session_state.import_video_ids = {}
                st.session_state.import_video_ids[clean_url] = video_id

                st.success(f"✅ {msg}")
                try:
                    videos_res = requests.get("http://127.0.0.1:8000/videos", params={"user_id": st.session_state.user_id})
                    if videos_res.status_code == 200:
                        st.session_state.video_data_cache = videos_res.json()
                except Exception as e:
                    st.error(f"❌ Failed to refresh videos after import: {e}")

            except Exception as e:
                st.error(f"❌ Import error: {e}")
    
    st.divider()

    # Progress section with better styling
    if st.session_state.import_status:
        st.markdown("""
        <h2 style="text-align: center; margin: 30px 0 20px;">⏳ Import Progress</h2>
        """, unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([1,1,1])
        with col2:
            refresh_btn = st.button("🔄 Refresh Status", use_container_width=True)
        
        if refresh_btn:
            with st.spinner("Updating status..."):
                try:
                    res = requests.get("http://127.0.0.1:8000/progress")
                    if res.status_code == 200:
                        for url in list(st.session_state.import_status.keys()):
                            if url in res.json():
                                st.session_state.import_status[url] = res.json()[url]
                except Exception as e:
                    st.error(f"❌ Progress update error: {e}")
        
        # Display each status in a nice card
        for url, status in st.session_state.import_status.items():
            progress_color = "#fc6076" if st.session_state.theme == "dark" else "#0072ff"
            if status == "Completed":
                progress_color = "#43cea2" if st.session_state.theme == "dark" else "#00b09b"
            elif status == "Failed":
                progress_color = "#cb2d3e" if st.session_state.theme == "dark" else "#ff512f"
                
            st.markdown(f"""
            <div style="background: {import_card_bg}; padding: 15px; border-radius: 12px; 
                      border-left: 4px solid {progress_color}; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📽️ <code>{url[:50]}{"..." if len(url) > 50 else ""}</code></span>
                    <span style="font-weight: bold; color: {progress_color};">{status}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

    st.divider()

    # Videos section with improved styling
    st.markdown("""
    <h2 style="text-align: center; margin: 30px 0 20px;">🎞️ Your TikTok Videos</h2>
    """, unsafe_allow_html=True)
    
    try:
        with st.spinner("Loading your videos..."):
            if not st.session_state.video_data_cache:
                res = requests.get("http://127.0.0.1:8000/videos", params={"user_id": st.session_state.user_id})
                if res.status_code == 200:
                    st.session_state.video_data_cache = res.json()
                else:
                    st.error("❌ Couldn't load your videos.")
            videos = st.session_state.video_data_cache
            if videos:
                    for row_i in range(0, len(videos), 3):
                        cols = st.columns(3)
                        for col_i in range(min(3, len(videos) - row_i)):
                            vid = videos[row_i + col_i]
                            with cols[col_i]:
                                stats_html = f"""
                                <div style="display: flex; justify-content: space-around; width: 100%; 
                                            margin: 10px 0; padding: 10px; border-radius: 10px; 
                                            background: {'rgba(28, 30, 38, 0.7)' if st.session_state.theme == 'dark' else 'rgba(244, 247, 251, 0.7)'};">
                                    <div style="text-align: center;">
                                        <div style="font-size: 1.2rem; font-weight: bold;">👁️</div>
                                        <div>{vid.get("video_playcount", 0)}</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 1.2rem; font-weight: bold;">❤️</div>
                                        <div>{vid.get("video_diggcount", 0)}</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 1.2rem; font-weight: bold;">💬</div>
                                        <div>{vid.get("video_commentcount", 0)}</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 1.2rem; font-weight: bold;">🔁</div>
                                        <div>{vid.get("video_sharecount", 0)}</div>
                                    </div>
                                </div>
                                """

                                st.markdown(f"""
                                <div class="video-bubble">
                                    <video controls style="width: 100%; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                                        <source src="{vid['file_path']}" type="video/mp4">
                                        Your browser does not support the video tag.
                                    </video>
                                    <div class="stats" style="margin: 12px 0; padding: 8px; width: 100%; 
                                                            border-radius: 8px; text-align: center;">
                                        <span style="font-weight: bold;">TikTok ID:</span> {vid["id"]} | 
                                        <a href="{vid["url"]}" target="_blank" style="font-weight: bold;">View Original</a>
                                    </div>
                                    {stats_html}
                                </div>
                                """, unsafe_allow_html=True)

                                q_key = f"q_{vid['id']}"
                                st.text_input("Ask about this video", key=q_key, placeholder="What's this video about?")
                                
                                col1, col2 = st.columns(2)
                                with col1:
                                    if st.button("💬 Ask", key=f"ask_{vid['id']}", use_container_width=True):
                                        question = st.session_state.get(q_key)
                                        if question:
                                            with st.spinner("Getting answer..."):
                                                try:
                                                    resp = requests.post("http://127.0.0.1:8000/query", json={
                                                        "video_id": vid["id"],
                                                        "question": question
                                                    })
                                                    if resp.status_code == 200:
                                                        st.success("🤖 " + resp.json().get("answer", "No response"))
                                                    else:
                                                        st.warning("No answer returned.")
                                                except Exception as e:
                                                    st.error(f"❌ Query error: {e}")
                                with col2:
                                    if st.button("🔍 View Details", key=f"full_{vid['id']}", use_container_width=True):
                                        st.session_state.selected_video = vid["id"]
                                        st.query_params.update({"page": "video"})
                                        st.rerun()

            else:
                st.info("👋 You haven't imported any videos yet. Start by pasting a TikTok URL above!")
    except Exception as e:
        st.error(f"Video fetch error: {e}")

if st.session_state.import_status and all(v == "Completed" for v in st.session_state.import_status.values()):
    st.session_state.import_status = {}
# --- Video Detail Page ---
elif page == "video":
    if not st.session_state.selected_video:
        st.warning("No video selected.")
        st.query_params.update({"page": "dashboard"})
        st.rerun()

    try:
        res = requests.get("http://127.0.0.1:8000/videos", params={"user_id": st.session_state.user_id})
        if res.status_code == 200:
            videos = res.json()
            video = next((v for v in videos if v['id'] == st.session_state.selected_video), None)
            if video:
                # Create colorful header
                st.markdown(f"""
                <div style="text-align: center; padding: 20px 0;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 20px;">🎬 Video Analysis</h1>
                </div>
                """, unsafe_allow_html=True)
                
                # Video player with stats
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.video(video["file_path"])
                
                with col2:
                    # Create an attractive stats card
                    card_bg = "#1c1e26" if st.session_state.theme == "dark" else "#ffffff"
                    card_border = "#fc6076" if st.session_state.theme == "dark" else "#0072ff"
                    card_border2 = "#ff9a44" if st.session_state.theme == "dark" else "#00c6ff"
                    
                    st.markdown(f"""
                    <div style="background: linear-gradient(135deg, {card_bg} 0%, {card_bg} 100%); 
                               padding: 20px; border-radius: 16px; height: 100%; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
                               border-left: 4px solid {card_border}; border-right: 4px solid {card_border2};">
                        <h3 style="text-align: center; margin-bottom: 20px;">📊 Video Statistics</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="text-align: center; padding: 15px; border-radius: 10px; 
                                        background: {'rgba(28, 30, 38, 0.7)' if st.session_state.theme == 'dark' else 'rgba(244, 247, 251, 0.7)'};">
                                <div style="font-size: 2rem;">👁️</div>
                                <div style="font-size: 1.5rem; font-weight: bold;">{video.get("video_playcount", 0)}</div>
                                <div>Views</div>
                            </div>
                            <div style="text-align: center; padding: 15px; border-radius: 10px; 
                                        background: {'rgba(28, 30, 38, 0.7)' if st.session_state.theme == 'dark' else 'rgba(244, 247, 251, 0.7)'};">
                                <div style="font-size: 2rem;">❤️</div>
                                <div style="font-size: 1.5rem; font-weight: bold;">{video.get("video_diggcount", 0)}</div>
                                <div>Likes</div>
                            </div>
                            <div style="text-align: center; padding: 15px; border-radius: 10px; 
                                        background: {'rgba(28, 30, 38, 0.7)' if st.session_state.theme == 'dark' else 'rgba(244, 247, 251, 0.7)'};">
                                <div style="font-size: 2rem;">💬</div>
                                <div style="font-size: 2rem;">💬</div>
                                <div style="font-size: 1.5rem; font-weight: bold;">{video.get("video_commentcount", 0)}</div>
                                <div>Comments</div>
                            </div>
                            <div style="text-align: center; padding: 15px; border-radius: 10px; 
                                        background: {'rgba(28, 30, 38, 0.7)' if st.session_state.theme == 'dark' else 'rgba(244, 247, 251, 0.7)'};">
                                <div style="font-size: 2rem;">🔁</div>
                                <div style="font-size: 1.5rem; font-weight: bold;">{video.get("video_sharecount", 0)}</div>
                                <div>Shares</div>
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

                st.divider()

                # Transcript Display
                st.markdown(f"""
                <div style="padding: 20px; border-radius: 16px;
                            background: {'#252836' if st.session_state.theme == 'dark' else '#f4f7fb'};
                            border-left: 4px solid {card_border}; border-right: 4px solid {card_border2};
                            box-shadow: 0 8px 20px rgba(0,0,0,0.1); margin-top: 20px;">
                    <h3 style="text-align: center; margin-bottom: 10px;">📝 Video Transcript</h3>
                    <p style="line-height: 1.6; color: {'#f1f1f1' if st.session_state.theme == 'dark' else '#333'};">
                        {video.get("transcript", "No transcript available.")}
                    </p>
                </div>
                """, unsafe_allow_html=True)

                st.divider()

                # Ask about video section
                st.markdown(f"""
                <div style="padding: 20px; border-radius: 16px;
                            background: {'#1c1e26' if st.session_state.theme == 'dark' else '#ffffff'};
                            border-left: 4px solid {card_border}; border-right: 4px solid {card_border2};
                            box-shadow: 0 8px 20px rgba(0,0,0,0.1); margin-top: 20px;">
                    <h3 style="text-align: center; margin-bottom: 10px;">❓ Ask About This Video</h3>
                </div>
                """, unsafe_allow_html=True)

                question = st.text_input("Ask something about this video", key="detail_question")
                if st.button("💬 Get Answer", use_container_width=True):
                    if question:
                        with st.spinner("Thinking..."):
                            try:
                                resp = requests.post("http://127.0.0.1:8000/query", json={
                                    "video_id": video["id"],
                                    "question": question
                                })
                                if resp.status_code == 200:
                                    st.success("🤖 " + resp.json().get("answer", "No response"))
                                else:
                                    st.warning("No answer returned.")
                            except Exception as e:
                                st.error(f"❌ Error: {e}")
                    else:
                        st.warning("Please enter a question.")

            else:
                st.error("❌ Video not found.")
                st.query_params.update({"page": "dashboard"})
                st.rerun()
        else:
            st.error("❌ Failed to load video details.")
    except Exception as e:
        st.error(f"❌ Video detail error: {e}")

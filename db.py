# db.py
import sqlite3

DB_PATH = "./db/tiktok_videos_processor.db"

def get_db():
    """Connect to the SQLite database (creates file if it doesn't exist)."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables for users and videos if they don't already exist."""
    conn = get_db()
    cursor = conn.cursor()
    # Users table: id, username, password
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE,         
    file_path TEXT,
    transcript TEXT,
    video_id TEXT,
    video_timestamp TEXT,
    video_duration INTEGER,
    video_locationcreated TEXT,
    video_diggcount INTEGER,
    video_sharecount INTEGER,
    video_commentcount INTEGER,
    video_playcount INTEGER,
    video_description TEXT,
    video_is_ad BOOLEAN,
    author_username TEXT,
    author_name TEXT,
    author_followercount INTEGER,
    author_followingcount INTEGER,
    author_heartcount INTEGER,
    author_videocount INTEGER,
    author_diggcount INTEGER,
    author_verified BOOLEAN,
    poi_name TEXT,
    poi_address TEXT,
    poi_city TEXT
)
    """)

    # User–Video link table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        video_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(video_id) REFERENCES videos(id),
        UNIQUE(user_id, video_id)  -- prevent duplicate links
    )
    """)
    conn.commit()
    conn.close()

def add_user(email, password):
    """Insert a new user (returns user id) or ignore if exists."""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, password))
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        # Username already exists
        user_id = None
    conn.close()
    return user_id["id"]

def validate_user(email, password):
    """Check email/password. Returns user row or None."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ? AND password = ?", (email, password))
    user = cursor.fetchone()
    conn.close()
    if user is None:
        return None
    return user["id"]

def get_video_by_url(url):
    """Return the video row if it exists, else None."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM videos WHERE url = ?", (url,))
    row = cur.fetchone()
    conn.close()
    return row
def add_video_record(url, file_path, transcript,metadata):
    """Insert into videos; returns the new video_id."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO videos (
            url, file_path, transcript, video_id, video_timestamp,
            video_duration, video_locationcreated, video_diggcount,
            video_sharecount, video_commentcount, video_playcount,
            video_description, video_is_ad, author_username,
            author_name, author_followercount, author_followingcount,
            author_heartcount, author_videocount, author_diggcount,
            author_verified, poi_name, poi_address, poi_city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        url, file_path, transcript,
        metadata.get("video_id"),
        metadata.get("video_timestamp"),
        metadata.get("video_duration"),
        metadata.get("video_locationcreated"),
        metadata.get("video_diggcount"),
        metadata.get("video_sharecount"),
        metadata.get("video_commentcount"),
        metadata.get("video_playcount"),
        metadata.get("video_description"),
        metadata.get("video_is_ad") == "True",  # Convert string to boolean
        metadata.get("author_username"),
        metadata.get("author_name"),
        metadata.get("author_followercount"),
        metadata.get("author_followingcount"),
        metadata.get("author_heartcount"),
        metadata.get("author_videocount"),
        metadata.get("author_diggcount"),
        metadata.get("author_verified") == "True",
        metadata.get("poi_name"),
        metadata.get("poi_address"),
        metadata.get("poi_city")
    ))
    conn.commit()
    vid = cur.lastrowid
    conn.close()
    return vid

def link_user_video(user_id, video_id):
    """Link a user to a video (ignores if already linked)."""
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO user_videos (user_id, video_id) VALUES (?, ?)",
            (user_id, video_id)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        # already linked
        pass
    conn.close()

def get_videos_for_user(user_id):
    """Return list of videos (with transcript) linked to this user."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
      SELECT v.id, v.url, v.file_path, v.transcript
      FROM videos v
      JOIN user_videos uv ON uv.video_id = v.id
      WHERE uv.user_id = ?
    """, (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows


def get_transcript(video_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM videos")
    rows = cursor.fetchall()
    conn.close()
    """Return the transcript text for a given video."""
    print(f"Querying transcript for video_id: {video_id} (type: {type(video_id)})")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT transcript FROM videos WHERE id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()
    return row["transcript"] if row else ""

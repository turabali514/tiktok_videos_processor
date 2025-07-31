# db.py
import sqlite3
import os
import json
DB_PATH = "./db/tiktok_videos_processor.db"

def get_db():
    """Connect to the SQLite database (creates file if it doesn't exist)."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
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
    video_id TEXT UNIQUE,
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
    poi_city TEXT,
    summary TEXT
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
    # Highlights table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        video_id INTEGER,
        title TEXT,
        text TEXT,
        color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(video_id) REFERENCES videos(id)
    )
    """)

    # Collections table: each user can have collections with unique names
    cursor.execute("""
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'Folder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, name)  -- no duplicate collection names for same user
)
""")

    # Collection-Video mapping table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS collection_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER,
        video_id INTEGER,
        FOREIGN KEY(collection_id) REFERENCES collections(id),
        FOREIGN KEY(video_id) REFERENCES videos(id),
        UNIQUE(collection_id, video_id)  -- prevent duplicate video in same collection
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
    except sqlite3.IntegrityError as e:
        # Username already exists
        print(e)
        user_id = None
    conn.close()
    return user_id


def validate_user(email, password):
    """Validate login. Returns specific errors or user ID."""
    conn = get_db()
    cursor = conn.cursor()

    # Check if email exists
    cursor.execute("SELECT id, password FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if user is None:
        conn.close()
        return {"error": "Email not registered"}

    # Check password
    if user["password"] != password:
        conn.close()
        return {"error": "Invalid password"}

    conn.close()
    return {"user_id": user["id"]}


def get_video_by_url(url):
    """Return the video row if it exists, else None."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM videos WHERE url = ?", (url,))
    row = cur.fetchone()
    conn.close()
    return row
def add_video_record(url, file_path, transcript,metadata,summary=None,tags=None):
    """Insert into videos; returns the new video_id."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(videos);")
    columns = [row[1] for row in cur.fetchall()]
    if "tags" not in columns:
        cur.execute("ALTER TABLE videos ADD COLUMN tags TEXT;")
        conn.commit()
    cur.execute("""
        INSERT INTO videos (
            url, file_path, transcript, video_id, video_timestamp,
            video_duration, video_locationcreated, video_diggcount,
            video_sharecount, video_commentcount, video_playcount,
            video_description, video_is_ad, author_username,
            author_name, author_followercount, author_followingcount,
            author_heartcount, author_videocount, author_diggcount,
            author_verified, poi_name, poi_address, poi_city,summary,tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
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
        metadata.get("poi_city"),
        summary,
        json.dumps(tags) if tags else None
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
      SELECT v.id, v.url, v.file_path, v.transcript,v.video_playcount, v.video_diggcount,
             v.video_commentcount, v.video_sharecount,v.summary,v.video_description,v.tags
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
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT transcript FROM videos WHERE id = ?", (video_id,))
    row = cursor.fetchone()
    conn.close()
    return row["transcript"] if row else ""
def add_highlight(user_id: int, video_id: int, title: str, text: str, color: str) -> int:
    """Add a new highlight and return its ID."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(highlights)")
    columns = [row[1] for row in cursor.fetchall()]
    if "color" not in columns:
        cursor.execute("ALTER TABLE highlights ADD COLUMN color TEXT")
    cursor.execute(
        "INSERT INTO highlights (user_id, video_id, title, text, color) VALUES (?, ?, ?, ?, ?)",
        (user_id, video_id, title, text, color)
    )
    conn.commit()
    highlight_id = cursor.lastrowid
    conn.close()
    return highlight_id

def get_highlights_for_video(user_id: int, video_id: int) -> list:
    """Get all highlights for a specific video and user."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, text, color, created_at FROM highlights WHERE user_id = ? AND video_id = ?",
        (user_id, video_id)
    )
    highlights = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return highlights

def update_highlight(highlight_id: int, title: str, color: str) -> bool:
    """Update a highlight's title and color."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE highlights SET title = ?, color = ? WHERE id = ?",
        (title, color, highlight_id)
    )
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0

def delete_highlight(highlight_id: int) -> bool:
    """Delete a highlight."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM highlights WHERE id = ?", (highlight_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected > 0
def create_collection(user_id: int, name: str, color: str = '#3b82f6', icon: str = 'Folder') -> int:
    conn = get_db()
    cursor = conn.cursor()
    print("entered db create_collection")
    cursor.execute("PRAGMA table_info(collections)")
    columns = [row[1] for row in cursor.fetchall()]
    # Add color column if it doesn't exist
    if 'color' not in columns:
        cursor.execute("ALTER TABLE collections ADD COLUMN color TEXT DEFAULT '#3b82f6'")
    
    # Add icon column if it doesn't exist
    if 'icon' not in columns:
        cursor.execute("ALTER TABLE collections ADD COLUMN icon TEXT DEFAULT 'Folder'")
    cursor.execute(
        "INSERT INTO collections (user_id, name, color, icon) VALUES (?, ?, ?, ?)",
        (user_id, name, color, icon)
    )
    conn.commit()
    collection_id = cursor.lastrowid
    conn.close()
    print("from db",collection_id)
    return collection_id

def get_collections(user_id: int) -> list:
    """Get all collections for a user with their colors and icons"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, color, icon FROM collections WHERE user_id = ?",
        (user_id,)
    )
    collections = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return collections
def add_video_to_collection(collection_id: int, video_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO collection_videos (collection_id, video_id) VALUES (?, ?)",
        (collection_id, video_id)
    )
    conn.commit()
    conn.close()
def remove_video_from_collection(collection_id: int, video_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM collection_videos WHERE collection_id = ? AND video_id = ?",
        (collection_id, video_id)
    )
    conn.commit()
    conn.close()

def get_collection_videos(collection_id: int) -> list:
    """Get all videos in a specific collection"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT v.* FROM videos v
        JOIN collection_videos cv ON v.id = cv.video_id
        WHERE cv.collection_id = ?
    """, (collection_id,))
    videos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return videos
def delete_collection(user_id: int, collection_id: int):
    conn = get_db()
    cursor = conn.cursor()

    # Optional: check ownership to avoid deleting others' collections
    cursor.execute(
        "SELECT * FROM collections WHERE id = ? AND user_id = ?",
        (collection_id, user_id)
    )
    collection = cursor.fetchone()
    if not collection:
        raise Exception("Collection not found or unauthorized")

    # Delete the collection
    cursor.execute(
        "DELETE FROM collections WHERE id = ? AND user_id = ?",
        (collection_id, user_id)
    )
    conn.commit()

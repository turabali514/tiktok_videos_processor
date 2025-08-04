import psycopg2
import psycopg2.extras
import json
from typing import List, Dict, Optional, Union
from utils.utils import get_settings, get_logger
from fastapi import HTTPException, status
# Initialize settings and logger
settings = get_settings()
logger = get_logger(settings.LOGS_PATH)

class Database:
    """Database connection manager with context manager support"""
    def __enter__(self):
        self.conn = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD
        )
        self.conn.autocommit = True
        logger.debug("Database connection established")
        return self.conn
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            logger.error("Database operation failed", exc_info=(exc_type, exc_val, exc_tb))
        self.conn.close()
        logger.debug("Database connection closed")
def get_db():
        """
        FastAPI dependency that yields a database connection
        Compatible with FastAPI's Depends() system
        """
        try:
            with Database() as conn:
                yield conn
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection failed"
            )    
def execute_query(query: str, params: tuple = None, fetch: bool = False, single: bool = False):
    """Generic query executor with proper return type handling"""
    try:
        with Database() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                logger.debug(f"Executing query: {query[:100]}...")
                cur.execute(query, params or ())
                
                if fetch:
                    if single or 'RETURNING' in query.upper():
                        return cur.fetchone()  # Single dict or None
                    return cur.fetchall()  # List of dicts
                return cur.rowcount
    except psycopg2.Error as e:
        logger.error(f"Database error: {str(e)}", exc_info=True)
        raise


def add_user(email: str, password: str) -> Optional[int]:
    """Add a new user and return their ID"""
    try:
        result = execute_query(
            "INSERT INTO users (email, password) VALUES (%s, %s) RETURNING id",
            (email, password),
            fetch=True
        )
        if result:
            logger.info(f"New user created with ID: {result['id']}")
            return result['id']
        return None
    except psycopg2.IntegrityError:
        logger.warning(f"User already exists: {email}")
        return None

def validate_user(email: str, password: str) -> Dict[str, Union[int, str]]:
    """Validate user credentials with fixed return type handling"""
    user = execute_query(
        "SELECT id, password FROM users WHERE email = %s",
        (email,),
        fetch=True,
        single=True  # Ensure we get a single user or None
    )
    
    if not user:
        logger.warning(f"Login attempt for non-existent email: {email}")
        return {"error": "Email not registered"}
    
    if user["password"] != password:
        logger.warning(f"Invalid password attempt for user: {email}")
        return {"error": "Invalid password"}
    
    logger.info(f"Successful login for user: {email}")
    return {"user_id": user["id"]}

def get_video_by_url(url: str) -> Optional[Dict]:
    """Get video by URL"""
    video = execute_query(
        "SELECT * FROM videos WHERE url = %s",
        (url,),
        fetch=True
    )
    if video:
        logger.debug(f"Found video by URL: {url}")
    else:
        logger.debug(f"No video found for URL: {url}")
    return video

def add_video_record(url: str, file_path: str, transcript: str, 
                    metadata: Dict, summary: str = None, tags: List[str] = None) -> int:
    """Add video record with metadata"""
    try:
        result = execute_query("""
            INSERT INTO videos (
                url, file_path, transcript, video_id, video_timestamp,
                video_duration, video_locationcreated, video_diggcount,
                video_sharecount, video_commentcount, video_playcount,
                video_description, video_is_ad, author_username,
                author_name, author_followercount, author_followingcount,
                author_heartcount, author_videocount, author_diggcount,
                author_verified, poi_name, poi_address, poi_city, summary, tags
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
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
            metadata.get("video_is_ad") == "True",
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
        ), fetch=True)
        
        logger.info(f"Added video record with ID: {result['id']}")
        return result['id']
    except Exception as e:
        logger.error(f"Failed to add video record: {str(e)}")
        raise

def link_user_video(user_id: int, video_id: int) -> None:
    """Link user to a video"""
    rows = execute_query(
        "INSERT INTO user_videos (user_id, video_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (user_id, video_id)
    )
    if rows > 0:
        logger.debug(f"Linked user {user_id} to video {video_id}")

def get_videos_for_user(user_id: int) -> List[Dict]:
    """Get all videos for a user exactly as stored in DB"""
    try:
        videos = execute_query("""
            SELECT v.id, v.url, v.file_path, v.transcript, 
                   v.video_playcount, v.video_diggcount,
                   v.video_commentcount, v.video_sharecount, 
                   v.summary, v.video_description, v.tags
            FROM videos v
            JOIN user_videos uv ON uv.video_id = v.id
            WHERE uv.user_id = %s
        """, (user_id,), fetch=True)
        
        if not videos:
            logger.debug(f"No videos found for user {user_id}")
            return []
            
        logger.debug(f"Retrieved {len(videos)} videos for user {user_id}")
        return videos
        
    except Exception as e:
        logger.error(f"Database error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Error retrieving videos"
        )
def get_transcript(video_id: int) -> str:
    """Get transcript for a video"""
    result = execute_query(
        "SELECT transcript FROM videos WHERE id = %s",
        (video_id,),
        fetch=True
    )
    return result["transcript"] if result else ""

# Highlight-related functions
def add_highlight(user_id: int, video_id: int, title: str, text: str, color: str, confidence_score: float) -> int:
    """Add a highlight"""
    result = execute_query(
        "INSERT INTO highlights (user_id, video_id, title, text, color, confidence_score) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
        (user_id, video_id, title, text, color, confidence_score),
        fetch=True
    )
    logger.info(f"Added highlight {result['id']} for video {video_id} with confidence {confidence_score}")
    return result['id']

def get_highlights_for_video(user_id: int, video_id: int) -> List[Dict]:
    """Get highlights for a video"""
    highlights = execute_query(
        "SELECT id, title, text, color, created_at FROM highlights WHERE user_id = %s AND video_id = %s",
        (user_id, video_id),
        fetch=True
    )
    logger.debug(f"Retrieved {len(highlights)} highlights for video {video_id}")
    return highlights

def update_highlight(highlight_id: int, title: str, color: str) -> bool:
    """Update a highlight and mark as user-edited"""
    rows = execute_query(
        "UPDATE highlights SET title = %s, color = %s, confidence_score = 2.0 WHERE id = %s",
        (title, color, highlight_id)
    )
    success = rows > 0
    if success:
        logger.info(f"Updated highlight {highlight_id} (user-edited, confidence = 2.0)")
    else:
        logger.warning(f"Highlight not found for update: {highlight_id}")
    return success

def delete_highlight(highlight_id: int) -> bool:
    """Delete a highlight"""
    rows = execute_query(
        "DELETE FROM highlights WHERE id = %s",
        (highlight_id,)
    )
    success = rows > 0
    if success:
        logger.info(f"Deleted highlight {highlight_id}")
    else:
        logger.warning(f"Highlight not found for deletion: {highlight_id}")
    return success

# Collection-related functions
def create_collection(user_id: int, name: str, color: str = '#3b82f6', icon: str = 'Folder') -> int:
    """Create a new collection"""
    result = execute_query(
        "INSERT INTO collections (user_id, name, color, icon) VALUES (%s, %s, %s, %s) RETURNING id",
        (user_id, name, color, icon),
        fetch=True
    )
    logger.info(f"Created collection {result['id']} for user {user_id}")
    return result['id']

def get_collections(user_id: int) -> List[Dict]:
    """Get user collections"""
    collections = execute_query(
        "SELECT id, name, color, icon FROM collections WHERE user_id = %s",
        (user_id,),
        fetch=True
    )
    logger.debug(f"Retrieved {len(collections)} collections for user {user_id}")
    return collections

def add_video_to_collection(collection_id: int, video_id: int) -> None:
    """Add video to collection"""
    rows = execute_query(
        "INSERT INTO collection_videos (collection_id, video_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (collection_id, video_id)
    )
    if rows > 0:
        logger.info(f"Added video {video_id} to collection {collection_id}")

def remove_video_from_collection(collection_id: int, video_id: int) -> None:
    """Remove video from collection"""
    rows = execute_query(
        "DELETE FROM collection_videos WHERE collection_id = %s AND video_id = %s",
        (collection_id, video_id)
    )
    if rows > 0:
        logger.info(f"Removed video {video_id} from collection {collection_id}")

def get_collection_videos(collection_id: int) -> List[Dict]:
    """Get videos in collection"""
    videos = execute_query("""
        SELECT v.* FROM videos v
        JOIN collection_videos cv ON v.id = cv.video_id
        WHERE cv.collection_id = %s
    """, (collection_id,), fetch=True)
    logger.debug(f"Retrieved {len(videos)} videos from collection {collection_id}")
    return videos

def delete_collection(user_id: int, collection_id: int) -> None:
    """Delete a collection"""
    # Verify ownership first
    exists = execute_query(
        "SELECT 1 FROM collections WHERE id = %s AND user_id = %s",
        (collection_id, user_id),
        fetch=True
    )
    
    if not exists:
        logger.warning(f"Unauthorized collection deletion attempt: {collection_id} by user {user_id}")
        raise Exception("Collection not found or unauthorized")
    
    rows = execute_query(
        "DELETE FROM collections WHERE id = %s AND user_id = %s",
        (collection_id, user_id)
    )
    
    if rows > 0:
        logger.info(f"Deleted collection {collection_id}")
    else:
        logger.warning(f"Collection not found: {collection_id}")
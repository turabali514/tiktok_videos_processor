BEGIN;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
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
    summary TEXT,
    tags TEXT
);

-- User–Video link table
CREATE TABLE IF NOT EXISTS user_videos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    video_id INTEGER REFERENCES videos(id),
    UNIQUE(user_id, video_id)
);

COMMIT;

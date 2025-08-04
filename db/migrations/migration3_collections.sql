BEGIN;

CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'Folder',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS collection_videos (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER REFERENCES collections(id),
    video_id INTEGER REFERENCES videos(id),
    UNIQUE(collection_id, video_id)
);

COMMIT;

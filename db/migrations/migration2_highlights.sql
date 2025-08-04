BEGIN;

CREATE TABLE IF NOT EXISTS highlights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    video_id INTEGER REFERENCES videos(id),
    title TEXT,
    text TEXT,
    color TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMIT;

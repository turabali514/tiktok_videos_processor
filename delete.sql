BEGIN;

-- Delete from link/child tables first
DELETE FROM collection_videos;
DELETE FROM collections;
DELETE FROM highlights;
DELETE FROM user_videos;

-- Then delete from main data tables
DELETE FROM videos;
DELETE FROM users;

COMMIT;

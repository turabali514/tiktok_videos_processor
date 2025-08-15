BEGIN;

ALTER TABLE collection_videos
DROP CONSTRAINT collection_videos_collection_id_fkey,
ADD CONSTRAINT collection_videos_collection_id_fkey
FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

COMMIT;

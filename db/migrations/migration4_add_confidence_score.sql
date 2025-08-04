BEGIN;

ALTER TABLE highlights
ADD COLUMN confidence_score REAL;

COMMIT;

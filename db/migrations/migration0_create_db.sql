-- Migration 0: create database and user (run as superuser, e.g., postgres)
CREATE DATABASE tiktok_processor;
CREATE USER tiktok_user WITH PASSWORD 'PGPASSWORD';
GRANT ALL PRIVILEGES ON DATABASE tiktok_processor TO tiktok_user;


\connect tiktok_processor

-- Give user privileges on schema
GRANT USAGE, CREATE ON SCHEMA public TO tiktok_user;

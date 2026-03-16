-- Migration: Add raw_uploads table for data upload feature
-- Run: psql -U postgres -d your_db -f lib/migrations/001_raw_uploads.sql

CREATE TABLE IF NOT EXISTS raw_uploads (
  id SERIAL PRIMARY KEY,
  client_id VARCHAR(20),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_uploads_client ON raw_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_raw_uploads_uploaded_at ON raw_uploads(uploaded_at);

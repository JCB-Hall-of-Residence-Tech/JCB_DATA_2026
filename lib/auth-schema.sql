-- Authentication DB Schema
-- 1. Create database (once):
--    createdb -U postgres auth_db
--
-- 2. Apply schema:
--    psql -U postgres -d auth_db -f lib/auth-schema.sql
--
-- This schema is intentionally separate from the analytics_db used by the dashboard.

-- ---------------------------------------------------------------------------
-- users: primary identity table (email + password hash)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  email_verified_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ---------------------------------------------------------------------------
-- sessions: login sessions keyed by opaque token
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  user_agent    TEXT,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (session_token);

-- ---------------------------------------------------------------------------
-- email_verification_tokens: verify new accounts or email changes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verif_user_id ON email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verif_token ON email_verification_tokens (token);

-- ---------------------------------------------------------------------------
-- password_reset_tokens: password reset flow
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_token ON password_reset_tokens (token);

-- ---------------------------------------------------------------------------
-- helper extension: citext + uuid generation (if not already enabled)
-- ---------------------------------------------------------------------------

-- Note: enable these in your auth_db once (requires superuser):
--   CREATE EXTENSION IF NOT EXISTS citext;
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: Google OAuth + firstName/lastName schema
-- Run: psql "postgresql://vyapariq:vyapariq_secret@localhost:5433/vyapariq" \
--        -f backend/db/oauth.sql
-- Idempotent — safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. first_name column
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. last_name column
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. provider column
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'local';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Populate first_name / last_name from existing name column
UPDATE users
SET
  first_name = TRIM(SPLIT_PART(COALESCE(name, email), ' ', 1)),
  last_name  = CASE
                 WHEN POSITION(' ' IN COALESCE(name, '')) > 0
                 THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
                 ELSE ''
               END
WHERE first_name = '';

-- 5. Make password_hash nullable (Google users have no password)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 6. (Optional) add index on email if not exists
DO $$ BEGIN
  CREATE INDEX users_email_idx ON users (email);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

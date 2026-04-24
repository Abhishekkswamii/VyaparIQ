-- ── Admin Migration ───────────────────────────────────────────────────────────
-- Idempotent — safe to re-run. Run after schema.sql and orders.sql.

-- ── 1. Role column on users ───────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'user';

-- Add constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END
$$;

-- ── 2. Stock column on products ───────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 100;

-- ── 3. Promote an existing user to admin ─────────────────────────────────────
-- After registering via /api/auth/register, run:
--   UPDATE users SET role = 'admin' WHERE email = 'admin@smartcart.com';
--
-- Or insert a dedicated admin (password = 'Admin@1234', bcrypt hash below):
-- INSERT INTO users (name, email, password_hash, role)
-- VALUES (
--   'Admin',
--   'admin@smartcart.com',
--   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
--   'admin'
-- )
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';

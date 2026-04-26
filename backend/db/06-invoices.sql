-- Add payment_method to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cod';

-- Extend status to support full tracking lifecycle
-- (PostgreSQL TEXT column already accepts any value)

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id             SERIAL PRIMARY KEY,
  invoice_id     VARCHAR(50) UNIQUE NOT NULL,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  invoice_url    TEXT,
  storage_path   TEXT,
  file_size      INTEGER,
  invoice_status VARCHAR(20) NOT NULL DEFAULT 'generated',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id  ON invoices(user_id);

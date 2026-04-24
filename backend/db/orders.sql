-- ── Orders Migration ─────────────────────────────────────────────────────────
-- Run after schema.sql. Idempotent (safe to re-run).

-- ── Orders ───────────────────────────────────────────────────────────────────
-- Stores one record per checkout. delivery_address is a JSONB snapshot so the
-- order is never affected if a user later changes their address details.

CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status           VARCHAR(20)    NOT NULL DEFAULT 'confirmed'
                         CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    subtotal         DECIMAL(10, 2) NOT NULL,
    discount         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount     DECIMAL(10, 2) NOT NULL,
    delivery_address JSONB          NOT NULL,
    created_at       TIMESTAMP      DEFAULT NOW(),
    updated_at       TIMESTAMP      DEFAULT NOW()
);

-- ── Order Items ───────────────────────────────────────────────────────────────
-- Price/name snapshots are stored here so historical orders are never mutated
-- when product data changes. product_id is a soft FK (nullable) so the row
-- survives even if the product is later deleted.

CREATE TABLE IF NOT EXISTS order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  INTEGER        REFERENCES products(id) ON DELETE SET NULL,
    name        VARCHAR(200)   NOT NULL,
    category    VARCHAR(50),
    price       DECIMAL(10, 2) NOT NULL,
    quantity    INTEGER        NOT NULL CHECK (quantity > 0),
    line_total  DECIMAL(10, 2) NOT NULL,
    created_at  TIMESTAMP      DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

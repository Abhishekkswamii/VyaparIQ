-- SmartCart Database Schema

-- ── Users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     DEFAULT NOW(),
    updated_at    TIMESTAMP     DEFAULT NOW()
);

-- ── Products ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(200)   NOT NULL,
    price                   DECIMAL(10, 2) NOT NULL,
    category                VARCHAR(50)    NOT NULL,
    barcode                 VARCHAR(50)    UNIQUE,
    image_url               TEXT,
    cheaper_alternative_id  INTEGER        REFERENCES products(id),
    created_at              TIMESTAMP      DEFAULT NOW()
);

-- ── Cart Items ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL DEFAULT 1,
    added_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- ── Shopping Sessions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_sessions (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount      DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_spent       DECIMAL(10, 2) NOT NULL DEFAULT 0,
    item_count        INTEGER        NOT NULL DEFAULT 0,
    budget_amount     DECIMAL(10, 2) DEFAULT 0,
    savings_achieved  DECIMAL(10, 2) DEFAULT 0,
    items_json        JSONB,
    started_at        TIMESTAMP      DEFAULT NOW(),
    ended_at          TIMESTAMP,
    created_at        TIMESTAMP      DEFAULT NOW()
);

-- ── Budget Settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_settings (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    monthly_limit   DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
    alert_threshold DECIMAL(5, 2)  NOT NULL DEFAULT 80.00,
    updated_at      TIMESTAMP      DEFAULT NOW()
);

-- ── Expense Logs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  INTEGER        NOT NULL REFERENCES shopping_sessions(id) ON DELETE CASCADE,
    product_id  INTEGER        NOT NULL REFERENCES products(id),
    quantity    INTEGER        NOT NULL DEFAULT 1,
    amount      DECIMAL(10, 2) NOT NULL,
    created_at  TIMESTAMP      DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_items_user        ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_sessions_user ON shopping_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_logs_user      ON expense_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_logs_session   ON expense_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_products_category      ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_barcode       ON products(barcode);

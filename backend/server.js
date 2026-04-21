const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");
const Redis = require("ioredis");

const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const productRoutes = require("./routes/products");
const budgetRoutes = require("./routes/budget");
const sessionRoutes = require("./routes/sessions");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Database ─────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

// ── Redis ────────────────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

// Attach to app for use in routes
app.set("db", pool);
app.set("redis", redis);

// ── Routes ───────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    const redisPing = await redis.ping();
    res.json({ status: "ok", db: "connected", redis: redisPing });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/sessions", sessionRoutes);

// ── Error handler ────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`SmartCart backend running on port ${PORT}`);
});

module.exports = app;

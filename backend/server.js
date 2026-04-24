const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const { Pool } = require("pg");
const Redis = require("ioredis");
const { configurePassport } = require("./config/passport");

const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const productRoutes = require("./routes/products");
const budgetRoutes = require("./routes/budget");
const sessionRoutes = require("./routes/sessions");
const orderRoutes  = require("./routes/orders");
const adminRoutes  = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5174", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session — used only for the short-lived Google OAuth handshake
app.use(
  session({
    secret: process.env.SESSION_SECRET || "vyapariq_session_secret_dev",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 10 * 60 * 1000 }, // 10 min
  })
);
app.use(passport.initialize());
app.use(passport.session());

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

// Configure Passport with the DB pool
configurePassport(pool);

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
app.use("/api/orders",  orderRoutes);
app.use("/api/admin",   adminRoutes);

// ── Error handler ────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`VyaparIQ backend running on port ${PORT}`);
});

module.exports = app;

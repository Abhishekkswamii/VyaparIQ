// Load .env FIRST — before any other require that reads process.env
require("dotenv").config();

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
const chatAgentRoutes = require("./routes/chatAgent");
const visionProductRoutes = require("./routes/visionProduct");
const sessionRoutes = require("./routes/sessions");
const orderRoutes  = require("./routes/orders");
const adminRoutes  = require("./routes/admin");

// ── Startup: validate required environment variables ─────────────
function validateEnv() {
  const REQUIRED = ["DATABASE_URL", "JWT_SECRET", "SESSION_SECRET", "FRONTEND_URL"];
  const OPTIONAL_OAUTH = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"];

  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((k) => console.error(`   - ${k}`));
    console.error("\nCopy .env.example → .env and fill in all values, then restart.");
    process.exit(1);
  }

  const missingOAuth = OPTIONAL_OAUTH.filter((k) => !process.env[k]);
  if (missingOAuth.length > 0) {
    console.warn("⚠️  Google OAuth env vars not set — Google sign-in will be disabled:");
    missingOAuth.forEach((k) => console.warn(`   - ${k}`));
  }

  console.log("✓ All required environment variables present");
}

validateEnv();

// ── App ───────────────────────────────────────────────────────────
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Middleware ────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session — used only for the short-lived Google OAuth handshake
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 10 * 60 * 1000 }, // 10 min
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

// Health check — verify DB + Redis connectivity
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
app.use("/api/chat-agent", chatAgentRoutes);
app.use("/api/vision-product", visionProductRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/orders",  orderRoutes);
app.use("/api/admin",   adminRoutes);

// ── Global Error Handler ─────────────────────────────────────────
// Catches anything passed to next(err) and always returns JSON
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const { APP_NAME } = require("./config/branding");

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`${APP_NAME} backend running on port ${PORT}`);
});

module.exports = app;

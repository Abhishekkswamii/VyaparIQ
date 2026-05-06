const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const { sendPasswordResetEmail, sendGoogleAccountEmail, sendAccountDeletionEmail } = require("../utils/mailer");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";
const SALT_ROUNDS = 10;

// ── Helper ────────────────────────────────────────────────────────────────────

function makeToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      provider: user.provider || "local",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function userPayload(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    provider: user.provider || "local",
  };
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

router.post(
  "/register",
  [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const { firstName, lastName, email, password } = req.body;

      const existing = await db.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await db.query(
        `INSERT INTO users (name, first_name, last_name, email, password_hash, provider, role)
           VALUES ($1, $2, $3, $4, $5, 'local', 'user')
         RETURNING id, first_name, last_name, email, role, provider`,
        [`${firstName} ${lastName}`.trim(), firstName, lastName, email, hashedPassword]
      );

      const user = result.rows[0];
      const token = makeToken(user);
      res.status(201).json({ user: userPayload(user), token });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const { email, password } = req.body;

      const result = await db.query(
        `SELECT id, first_name, last_name, email, role, provider, password_hash
           FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];

      if (user.provider !== "local" || !user.password_hash) {
        return res.status(400).json({
          error: "This account uses Google sign-in. Please continue with Google.",
        });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = makeToken(user);
      res.json({ user: userPayload(user), token });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/google ──────────────────────────────────────────────────────

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ── GET /api/auth/google/callback ─────────────────────────────────────────────

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
    failureMessage: true,
  }),
  (req, res) => {
    if (!req.user) {
      console.error("[OAuth] No user on req after authenticate");
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
    const token = makeToken(req.user);
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

router.post("/logout", async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const redis = req.app.get("redis");
      const decoded = jwt.decode(token);
      const ttl = decoded?.exp
        ? decoded.exp - Math.floor(Date.now() / 1000)
        : 0;
      if (ttl > 0) await redis.set(`bl:${token}`, "1", "EX", ttl);
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────

router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Valid email required")],
  async (req, res, next) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

      const db    = req.app.get("db");
      const redis = req.app.get("redis");
      const { email } = req.body;

      const { rows } = await db.query(
        "SELECT id, first_name, provider FROM users WHERE email = $1",
        [email]
      );

      // Always respond success — never reveal whether email exists
      if (rows.length === 0) {
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }

      // Google OAuth user — send a helpful notice instead of silently skipping
      if (rows[0].provider !== "local") {
        try {
          await sendGoogleAccountEmail({ to: email, firstName: rows[0].first_name || "there" });
        } catch (e) { console.error("[mailer] google-account email failed:", e.message); }
        return res.json({ message: "If that email exists, a reset link has been sent." });
      }

      const user  = rows[0];
      const token = crypto.randomBytes(32).toString("hex");

      // Store token in Redis for 1 hour
      await redis.set(`pwd_reset:${token}`, String(user.id), "EX", 3600);

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

      await sendPasswordResetEmail({ to: email, firstName: user.first_name, resetUrl });

      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/reset-password ────────────────────────────────────────────

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      const errs = validationResult(req);
      if (!errs.isEmpty()) return res.status(400).json({ error: errs.array()[0].msg });

      const db    = req.app.get("db");
      const redis = req.app.get("redis");
      const { token, password } = req.body;

      const userId = await redis.get(`pwd_reset:${token}`);
      if (!userId) {
        return res.status(400).json({ error: "Reset link is invalid or has expired." });
      }

      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);

      // Invalidate token immediately after use
      await redis.del(`pwd_reset:${token}`);

      res.json({ message: "Password reset successfully. You can now sign in." });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/auth/account ─────────────────────────────────────────────────

router.delete("/account", authenticateToken, async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const userId = req.user.id;

    // Fetch user details before deletion (for farewell email)
    const { rows } = await db.query(
      "SELECT first_name, email FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    const { first_name, email } = rows[0];

    // Delete user — CASCADE removes all related data automatically
    await db.query("DELETE FROM users WHERE id = $1", [userId]);

    // Send farewell email (best-effort, non-fatal)
    try {
      await sendAccountDeletionEmail({ to: email, firstName: first_name || "there" });
    } catch (mailErr) {
      console.error("[mailer] deletion email failed (non-fatal):", mailErr.message);
    }

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

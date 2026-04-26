const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

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

module.exports = router;

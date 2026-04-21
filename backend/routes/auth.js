const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
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
      const { name, email, password } = req.body;

      const existing = await db.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await db.query(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
        [name, email, hashedPassword]
      );

      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
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
        "SELECT id, name, email, password_hash FROM users WHERE email = $1",
        [email]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const redis = req.app.get("redis");
      // Blacklist the token until it expires
      const decoded = jwt.decode(token);
      const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
      if (ttl > 0) {
        await redis.set(`bl:${token}`, "1", "EX", ttl);
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

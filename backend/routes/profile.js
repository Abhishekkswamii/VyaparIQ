"use strict";
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { authenticateToken: auth } = require("../middleware/auth");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── User profile ─────────────────────────────────────────────────────────────

router.get("/", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, first_name, last_name, email, phone, provider, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", auth, async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users
         SET first_name = COALESCE($1, first_name),
             last_name  = COALESCE($2, last_name),
             phone      = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, first_name, last_name, email, phone, provider, created_at`,
      [first_name || null, last_name || null, phone || null, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Addresses ─────────────────────────────────────────────────────────────────

router.get("/addresses", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/addresses", auth, async (req, res) => {
  const { label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const countRes = await client.query(
      "SELECT COUNT(*) FROM user_addresses WHERE user_id = $1", [req.user.id]
    );
    const isFirst = parseInt(countRes.rows[0].count) === 0;
    const makeDefault = isFirst || !!is_default;
    if (makeDefault) {
      await client.query("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [req.user.id]);
    }
    const { rows } = await client.query(
      `INSERT INTO user_addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, label || "Home", full_name, phone, address_line1, address_line2 || null, city, state, pincode, makeDefault]
    );
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/addresses/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const own = await client.query(
      "SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2", [id, req.user.id]
    );
    if (!own.rows[0]) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Address not found" }); }
    if (is_default) {
      await client.query("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [req.user.id]);
    }
    const { rows } = await client.query(
      `UPDATE user_addresses SET
         label         = COALESCE($1, label),
         full_name     = COALESCE($2, full_name),
         phone         = COALESCE($3, phone),
         address_line1 = COALESCE($4, address_line1),
         address_line2 = $5,
         city          = COALESCE($6, city),
         state         = COALESCE($7, state),
         pincode       = COALESCE($8, pincode),
         is_default    = COALESCE($9, is_default)
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [label, full_name, phone, address_line1, address_line2 || null, city, state, pincode, is_default ?? null, id, req.user.id]
    );
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete("/addresses/:id", auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM user_addresses WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Address not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/addresses/:id/default", auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [req.user.id]);
    const { rows } = await client.query(
      "UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Address not found" }); }
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;

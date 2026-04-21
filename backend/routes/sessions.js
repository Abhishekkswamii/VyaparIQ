const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

// GET /api/sessions — get shopping history
router.get("/", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const { limit = 20, offset = 0 } = req.query;

    const sessionsResult = await db.query(
      `SELECT ss.*,
              json_agg(
                json_build_object(
                  'product_id', el.product_id,
                  'product_name', p.name,
                  'quantity', el.quantity,
                  'amount', el.amount,
                  'category', p.category
                )
              ) AS items
       FROM shopping_sessions ss
       LEFT JOIN expense_logs el ON el.session_id = ss.id
       LEFT JOIN products p ON p.id = el.product_id
       WHERE ss.user_id = $1
       GROUP BY ss.id
       ORDER BY ss.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const countResult = await db.query(
      "SELECT COUNT(*) FROM shopping_sessions WHERE user_id = $1",
      [req.user.id]
    );

    res.json({
      sessions: sessionsResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/start — start a new shopping session
router.post("/start", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const redis = req.app.get("redis");
    const { budgetAmount = 0 } = req.body;

    const result = await db.query(
      `INSERT INTO shopping_sessions (user_id, budget_amount, started_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [req.user.id, budgetAmount]
    );

    const session = result.rows[0];

    // Cache active session in Redis for fast access
    if (redis) {
      await redis.set(
        `session:active:${req.user.id}`,
        JSON.stringify({ id: session.id, started_at: session.started_at }),
        { EX: 86400 } // 24h expiry
      );
    }

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/end — end an active session with final data
router.post("/end", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const redis = req.app.get("redis");
    const { items = [], totalSpent = 0, savingsAchieved = 0 } = req.body;

    // Get active session from Redis or find latest
    let sessionId;
    if (redis) {
      const cached = await redis.get(`session:active:${req.user.id}`);
      if (cached) sessionId = JSON.parse(cached).id;
    }

    if (!sessionId) {
      const latest = await db.query(
        `SELECT id FROM shopping_sessions
         WHERE user_id = $1 AND ended_at IS NULL
         ORDER BY started_at DESC LIMIT 1`,
        [req.user.id]
      );
      if (latest.rows.length) sessionId = latest.rows[0].id;
    }

    if (!sessionId) {
      // Create one on the fly
      const ins = await db.query(
        `INSERT INTO shopping_sessions (user_id, budget_amount, started_at)
         VALUES ($1, 0, NOW()) RETURNING id`,
        [req.user.id]
      );
      sessionId = ins.rows[0].id;
    }

    // Update session
    const result = await db.query(
      `UPDATE shopping_sessions
       SET total_spent = $1, item_count = $2, savings_achieved = $3,
           items_json = $4, ended_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [totalSpent, items.length, savingsAchieved, JSON.stringify(items), sessionId]
    );

    // Log individual expense items
    for (const item of items) {
      await db.query(
        `INSERT INTO expense_logs (user_id, session_id, product_id, quantity, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, sessionId, item.productId || 0, item.quantity || 1, item.amount || 0]
      );
    }

    // Clear Redis active session
    if (redis) {
      await redis.del(`session:active:${req.user.id}`);
    }

    // Clear cart items in DB
    await db.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id]);

    res.json({ session: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id — get full session breakdown
router.get("/:id", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const { id } = req.params;

    const result = await db.query(
      `SELECT ss.*,
              json_agg(
                json_build_object(
                  'product_id', el.product_id,
                  'product_name', p.name,
                  'quantity', el.quantity,
                  'amount', el.amount,
                  'category', p.category
                )
              ) FILTER (WHERE el.id IS NOT NULL) AS items
       FROM shopping_sessions ss
       LEFT JOIN expense_logs el ON el.session_id = ss.id
       LEFT JOIN products p ON p.id = el.product_id
       WHERE ss.id = $1 AND ss.user_id = $2
       GROUP BY ss.id`,
      [id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ session: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

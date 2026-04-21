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

module.exports = router;

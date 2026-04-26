const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

// GET /api/budget — get user's budget settings
router.get("/", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const result = await db.query(
      "SELECT * FROM budget_settings WHERE user_id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ budget: null, message: "No budget set" });
    }

    // Calculate total spent this month
    const spentResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_spent
       FROM expense_logs
       WHERE user_id = $1
         AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [req.user.id]
    );

    const budget = result.rows[0];
    const totalSpent = parseFloat(spentResult.rows[0].total_spent);
    const remaining = parseFloat(budget.monthly_limit) - totalSpent;

    const limit = parseFloat(budget.monthly_limit) || 0;
    const percentUsed = limit > 0 ? (totalSpent / limit) * 100 : 0;
    res.json({
      budget,
      total_spent: totalSpent.toFixed(2),
      remaining: remaining.toFixed(2),
      percentage_used: percentUsed.toFixed(1),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/budget — create or update budget settings
router.put(
  "/",
  [
    body("monthly_limit")
      .isFloat({ min: 0 })
      .withMessage("monthly_limit must be a positive number"),
    body("alert_threshold")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("alert_threshold must be between 0 and 100"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const { monthly_limit, alert_threshold = 80 } = req.body;

      const result = await db.query(
        `INSERT INTO budget_settings (user_id, monthly_limit, alert_threshold)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET monthly_limit = $2, alert_threshold = $3, updated_at = NOW()
         RETURNING *`,
        [req.user.id, monthly_limit, alert_threshold]
      );

      res.json({ budget: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/budget/alerts — check if user is approaching or over budget
router.get("/alerts", async (req, res, next) => {
  try {
    const db = req.app.get("db");

    const budgetResult = await db.query(
      "SELECT * FROM budget_settings WHERE user_id = $1",
      [req.user.id]
    );

    if (budgetResult.rows.length === 0) {
      return res.json({ alerts: [], message: "No budget configured" });
    }

    const budget = budgetResult.rows[0];
    const limit = parseFloat(budget.monthly_limit);
    const threshold = parseFloat(budget.alert_threshold);

    const spentResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_spent
       FROM expense_logs
       WHERE user_id = $1
         AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [req.user.id]
    );

    const totalSpent = parseFloat(spentResult.rows[0].total_spent);
    const percentUsed = limit > 0 ? (totalSpent / limit) * 100 : 0;
    const alerts = [];

    if (percentUsed >= 100) {
      alerts.push({
        type: "over_budget",
        severity: "critical",
        message: `You have exceeded your monthly budget by ₹${(totalSpent - limit).toFixed(2)}`,
      });
    } else if (percentUsed >= threshold) {
      alerts.push({
        type: "approaching_limit",
        severity: "warning",
        message: `You've used ${percentUsed.toFixed(1)}% of your monthly budget. ₹${(limit - totalSpent).toFixed(2)} remaining.`,
      });
    }

    res.json({
      alerts,
      total_spent: totalSpent.toFixed(2),
      monthly_limit: limit.toFixed(2),
      percentage_used: percentUsed.toFixed(1),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

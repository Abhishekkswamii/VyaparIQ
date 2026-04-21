const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// GET /api/cart — get current cart items
router.get("/", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const result = await db.query(
      `SELECT ci.id, ci.product_id, ci.quantity, ci.added_at,
              p.name, p.price, p.category, p.image_url, p.barcode,
              (ci.quantity * p.price) AS subtotal
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1
       ORDER BY ci.added_at DESC`,
      [req.user.id]
    );

    const items = result.rows;
    const total = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);

    res.json({ items, total: total.toFixed(2) });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart — add item to cart
router.post(
  "/",
  [
    body("product_id").isInt({ min: 1 }).withMessage("Valid product_id required"),
    body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be >= 1"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const redis = req.app.get("redis");
      const { product_id, quantity = 1 } = req.body;

      // Upsert: increment quantity if item already in cart
      const result = await db.query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + $3, added_at = NOW()
         RETURNING *`,
        [req.user.id, product_id, quantity]
      );

      // Invalidate cart cache
      await redis.del(`cart:${req.user.id}`);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/cart — remove item from cart (by cart item id via query param)
router.delete("/", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const redis = req.app.get("redis");
    const { item_id } = req.query;

    if (!item_id) {
      return res.status(400).json({ error: "item_id query param required" });
    }

    const result = await db.query(
      "DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *",
      [item_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await redis.del(`cart:${req.user.id}`);

    res.json({ message: "Item removed", item: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/checkout — checkout current cart
router.post("/checkout", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const redis = req.app.get("redis");
    const userId = req.user.id;

    // Get cart items
    const cartResult = await db.query(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const items = cartResult.rows;
    const totalAmount = items.reduce(
      (sum, i) => sum + i.quantity * parseFloat(i.price),
      0
    );

    // Create shopping session
    const sessionResult = await db.query(
      `INSERT INTO shopping_sessions (user_id, total_amount, item_count)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, totalAmount.toFixed(2), items.length]
    );

    // Log each item as an expense
    for (const item of items) {
      await db.query(
        `INSERT INTO expense_logs (user_id, session_id, product_id, quantity, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          sessionResult.rows[0].id,
          item.product_id,
          item.quantity,
          (item.quantity * parseFloat(item.price)).toFixed(2),
        ]
      );
    }

    // Clear cart
    await db.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
    await redis.del(`cart:${userId}`);

    res.json({
      message: "Checkout successful",
      session: sessionResult.rows[0],
      total: totalAmount.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

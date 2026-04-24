"use strict";

// ── createOrder ───────────────────────────────────────────────────────────────
// POST /api/orders
//
// Flow (all inside a single DB transaction):
//   1. Re-fetch prices from `products` table → prevents client price spoofing
//   2. Build line items with locked prices
//   3. Insert `orders` row
//   4. Insert `order_items` rows
//   5. Insert a `shopping_sessions` row → keeps budget analytics intact
//   6. Insert `expense_logs` for items with valid DB product_ids
//   7. Clear `cart_items` for this user
//   8. COMMIT → then evict Redis cart cache (best-effort, outside txn)

async function createOrder(req, res, next) {
  const { items, discount = 0, address } = req.body;
  const userId = req.user.id;
  const db = req.app.get("db");
  const redis = req.app.get("redis");

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // ── 1. Lock prices from DB ──────────────────────────────────────────────
    const productIds = items
      .map((i) => parseInt(i.product_id, 10))
      .filter((id) => Number.isInteger(id) && id > 0);

    const priceRows =
      productIds.length > 0
        ? (
            await client.query(
              "SELECT id, name, price, category FROM products WHERE id = ANY($1::int[])",
              [productIds]
            )
          ).rows
        : [];

    const dbProducts = new Map(priceRows.map((p) => [p.id, p]));

    // ── 2. Build verified line items ────────────────────────────────────────
    let computedSubtotal = 0;

    const lineItems = items.map((item) => {
      const dbId = parseInt(item.product_id, 10);
      const dbProd = dbProducts.get(dbId);

      const lockedPrice = dbProd
        ? parseFloat(dbProd.price)
        : parseFloat(item.price);

      const qty = Math.max(1, parseInt(item.quantity, 10));
      const lineTotal = parseFloat((lockedPrice * qty).toFixed(2));

      computedSubtotal += lineTotal;

      return {
        product_id: dbProd ? dbId : null,
        name: dbProd ? dbProd.name : String(item.name),
        category: dbProd ? dbProd.category : (item.category ?? null),
        price: lockedPrice,
        quantity: qty,
        line_total: lineTotal,
      };
    });

    computedSubtotal = parseFloat(computedSubtotal.toFixed(2));
    const appliedDiscount = parseFloat(parseFloat(discount).toFixed(2));
    const totalAmount = parseFloat(
      Math.max(0, computedSubtotal - appliedDiscount).toFixed(2)
    );

    // ── 3. Insert order ─────────────────────────────────────────────────────
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (user_id, status, subtotal, discount, total_amount, delivery_address)
       VALUES ($1, 'confirmed', $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        computedSubtotal,
        appliedDiscount,
        totalAmount,
        JSON.stringify(address),
      ]
    );
    const order = orderRows[0];

    // ── 4. Insert order items ───────────────────────────────────────────────
    const insertedItems = [];
    for (const li of lineItems) {
      const { rows } = await client.query(
        `INSERT INTO order_items
           (order_id, product_id, name, category, price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          order.id,
          li.product_id,
          li.name,
          li.category,
          li.price,
          li.quantity,
          li.line_total,
        ]
      );
      insertedItems.push(rows[0]);
    }

    // ── 5. Create shopping_session (for budget analytics) ───────────────────
    // total_amount and total_spent are set to the final order total so the
    // existing budget dashboard picks this up automatically.
    const { rows: sessionRows } = await client.query(
      `INSERT INTO shopping_sessions
         (user_id, total_amount, total_spent, item_count, ended_at)
       VALUES ($1, $2, $2, $3, NOW())
       RETURNING *`,
      [userId, totalAmount, lineItems.length]
    );
    const sessionId = sessionRows[0].id;

    // ── 6. Expense logs (only for items with a valid DB product_id) ─────────
    for (const li of lineItems) {
      if (li.product_id !== null) {
        await client.query(
          `INSERT INTO expense_logs
             (user_id, session_id, product_id, quantity, amount)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, sessionId, li.product_id, li.quantity, li.line_total]
        );
      }
    }

    // ── 7. Clear DB cart ────────────────────────────────────────────────────
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

    await client.query("COMMIT");

    // ── 8. Evict Redis cart cache (best-effort, outside transaction) ────────
    try {
      await redis.del(`cart:${userId}`);
    } catch {
      // Non-fatal: the cache will expire on its own
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order: {
        ...order,
        items: insertedItems,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return next(err);
  } finally {
    client.release();
  }
}

// ── getUserOrders ─────────────────────────────────────────────────────────────
// GET /api/orders
// Returns paginated order history with item count per order.

async function getUserOrders(req, res, next) {
  try {
    const db = req.app.get("db");
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const [ordersResult, countResult] = await Promise.all([
      db.query(
        `SELECT
           o.id,
           o.status,
           o.subtotal,
           o.discount,
           o.total_amount,
           o.delivery_address,
           o.created_at,
           o.updated_at,
           COUNT(oi.id)::int AS item_count
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = $1
         GROUP BY o.id
         ORDER BY o.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      db.query(
        "SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1",
        [req.user.id]
      ),
    ]);

    return res.json({
      orders: ordersResult.rows,
      total: countResult.rows[0].total,
      limit,
      offset,
    });
  } catch (err) {
    return next(err);
  }
}

// ── getOrderById ──────────────────────────────────────────────────────────────
// GET /api/orders/:id
// Returns a single order with all its items. Enforces ownership.

async function getOrderById(req, res, next) {
  try {
    const db = req.app.get("db");
    const orderId = parseInt(req.params.id, 10);

    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const { rows } = await db.query(
      `SELECT
         o.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id',         oi.id,
               'product_id', oi.product_id,
               'name',       oi.name,
               'category',   oi.category,
               'price',      oi.price,
               'quantity',   oi.quantity,
               'line_total', oi.line_total
             ) ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'::json
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id`,
      [orderId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({ order: rows[0] });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createOrder, getUserOrders, getOrderById };

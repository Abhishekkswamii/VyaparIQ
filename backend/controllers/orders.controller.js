"use strict";

const { generateInvoicePdf } = require("../utils/invoicePdf");
const { uploadInvoicePdf }   = require("../utils/gcsUpload");
const adminEvents            = require("../utils/adminEvents");

// ── helpers ────────────────────────────────────────────────────────────────────

function makeInvoiceId(orderId) {
  const ts  = Date.now().toString(36).toUpperCase();
  const seq = String(orderId).padStart(5, "0");
  return `INV-${seq}-${ts}`;
}

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
  const { items, discount = 0, address, payment_method = "cod" } = req.body;
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
              "SELECT id, name, price, category, stock FROM products WHERE id = ANY($1::int[]) FOR UPDATE",
              [productIds]
            )
          ).rows
        : [];

    const dbProducts = new Map(priceRows.map((p) => [p.id, p]));

    // ── 1b. Validate stock for all DB-tracked items ───────────────────────
    for (const item of items) {
      const dbId = parseInt(item.product_id, 10);
      const dbProd = new Map(priceRows.map((p) => [p.id, p])).get(dbId);
      if (dbProd && dbProd.stock !== null) {
        const qty = Math.max(1, parseInt(item.quantity, 10));
        if (dbProd.stock < qty) {
          await client.query("ROLLBACK");
          return res.status(422).json({
            error: `Insufficient stock for "${dbProd.name}". Available: ${dbProd.stock}, requested: ${qty}.`,
            code: "INSUFFICIENT_STOCK",
          });
        }
      }
    }

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
         (user_id, status, subtotal, discount, total_amount, delivery_address, payment_method)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        computedSubtotal,
        appliedDiscount,
        totalAmount,
        JSON.stringify(address),
        payment_method,
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

    // ── 6b. Decrement stock for all DB-tracked items ────────────────────────
    for (const li of lineItems) {
      if (li.product_id !== null) {
        await client.query(
          "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2",
          [li.quantity, li.product_id]
        );
      }
    }

    // ── 7. Clear DB cart ────────────────────────────────────────────────────
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

    await client.query("COMMIT");

    // ── 8. Evict Redis cart cache (best-effort, outside transaction) ────────
    try { await redis.del(`cart:${userId}`); } catch { /* non-fatal */ }

    // ── 8b. Broadcast new-order event to admin SSE listeners ─────────────────
    adminEvents.emit("new_order", { orderId: order.id, userId, total: totalAmount, status: "pending" });

    // ── 9. Generate invoice PDF + upload to GCS (outside transaction) ───────
    let invoiceRecord = null;
    try {
      const db = req.app.get("db");

      // Fetch user details for invoice
      const { rows: userRows } = await db.query(
        "SELECT first_name, last_name, email FROM users WHERE id = $1", [userId]
      );
      const u = userRows[0] || {};

      const invoiceId  = makeInvoiceId(order.id);
      const pdfBuffer  = await generateInvoicePdf({
        invoiceId,
        orderId:       order.id,
        orderDate:     order.created_at,
        orderStatus:   order.status,
        paymentMethod: payment_method,
        user: {
          name:  `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Customer",
          email: u.email || "",
        },
        address,
        items:     insertedItems,
        subtotal:  computedSubtotal,
        discount:  appliedDiscount,
        total:     totalAmount,
      });

      const { storagePath, fileSize } = await uploadInvoicePdf(userId, order.id, pdfBuffer);

      const { rows: invRows } = await db.query(
        `INSERT INTO invoices
           (invoice_id, order_id, user_id, storage_path, file_size, invoice_status)
         VALUES ($1, $2, $3, $4, $5, 'generated')
         RETURNING *`,
        [invoiceId, order.id, userId, storagePath, fileSize]
      );
      invoiceRecord = invRows[0];
      adminEvents.emit("invoice_ready", { orderId: order.id, invoiceId: invRows[0].invoice_id });
    } catch (invoiceErr) {
      console.error("[invoice] generation/upload failed (order still placed):", invoiceErr.message);
    }

    // Emit stock_update for each decremented product
    for (const li of lineItems) {
      if (li.product_id !== null) {
        try {
          const { rows: sr } = await db.query("SELECT stock FROM products WHERE id = $1", [li.product_id]);
          adminEvents.emit("stock_update", { productId: li.product_id, name: li.name, stock: sr[0]?.stock ?? 0 });
        } catch { /* non-fatal */ }
      }
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order: { ...order, items: insertedItems, payment_method },
      invoice: invoiceRecord,
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
           o.payment_method,
           o.created_at,
           o.updated_at,
           COUNT(oi.id)::int AS item_count,
           inv.invoice_id,
           inv.storage_path AS invoice_path,
           inv.invoice_status
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN invoices inv ON inv.order_id = o.id
         WHERE o.user_id = $1
         GROUP BY o.id, inv.invoice_id, inv.storage_path, inv.invoice_status
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
         ) AS items,
         inv.invoice_id,
         inv.storage_path AS invoice_path,
         inv.invoice_status
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN invoices inv ON inv.order_id = o.id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id, inv.invoice_id, inv.storage_path, inv.invoice_status`,
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

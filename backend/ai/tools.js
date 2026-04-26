"use strict";

// Pure DB/Redis operations — no Gemini, no business logic, no fallbacks.
// Each tool takes a context { db, redis } and typed params.

function toFloat(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ── searchProducts ────────────────────────────────────────────────────────────
// Returns up to `limit` products matching query (name / category / barcode).
async function searchProducts({ db }, { query, limit = 6 }) {
  const term = String(query || "").trim();
  if (!term) return [];
  const sql = `
    SELECT p.id, p.name, p.price, p.category, p.image_url, p.barcode,
           p.cheaper_alternative_id,
           ca.name AS alt_name, ca.price AS alt_price
    FROM products p
    LEFT JOIN products ca ON ca.id = p.cheaper_alternative_id
    WHERE p.name ILIKE $1 OR p.category ILIKE $1 OR p.barcode = $2
    ORDER BY
      CASE WHEN LOWER(p.name) = LOWER($2) THEN 0
           WHEN p.name ILIKE $3            THEN 1
           ELSE 2 END,
      p.price ASC, p.name ASC
    LIMIT $4`;
  const { rows } = await db.query(sql, [`%${term}%`, term, `${term}%`, limit]);
  return rows.map((r) => ({
    ...r,
    price: toFloat(r.price),
    alt_price: r.alt_price ? toFloat(r.alt_price) : null,
  }));
}

// ── getCart ───────────────────────────────────────────────────────────────────
async function getCart({ db }, { userId }) {
  const { rows } = await db.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.category, p.image_url, p.barcode,
            (ci.quantity * p.price) AS subtotal
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1 ORDER BY ci.added_at DESC`,
    [userId]
  );
  const items = rows.map((r) => ({ ...r, price: toFloat(r.price), subtotal: toFloat(r.subtotal) }));
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const itemCount = items.reduce((s, i) => s + Number(i.quantity), 0);
  return { items, total: parseFloat(total.toFixed(2)), itemCount };
}

// ── addToCart ─────────────────────────────────────────────────────────────────
async function addToCart({ db, redis }, { userId, productId, quantity = 1 }) {
  const qty = Math.max(1, parseInt(quantity, 10));
  await db.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + $3, added_at = NOW()`,
    [userId, productId, qty]
  );
  try { await redis.del(`cart:${userId}`); } catch {}
  return { productId, quantity: qty };
}

// ── removeFromCart ────────────────────────────────────────────────────────────
async function removeFromCart({ db, redis }, { userId, productId }) {
  await db.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [userId, productId]);
  try { await redis.del(`cart:${userId}`); } catch {}
  return { productId };
}

// ── updateCart ────────────────────────────────────────────────────────────────
async function updateCart({ db, redis }, { userId, productId, quantity }) {
  const qty = Math.max(0, parseInt(quantity, 10));
  if (qty === 0) {
    return removeFromCart({ db, redis }, { userId, productId });
  }
  await db.query(
    "UPDATE cart_items SET quantity = $1, added_at = NOW() WHERE user_id = $2 AND product_id = $3",
    [qty, userId, productId]
  );
  try { await redis.del(`cart:${userId}`); } catch {}
  return { productId, quantity: qty };
}

// ── getBudget ─────────────────────────────────────────────────────────────────
async function getBudget({ db }, { userId }) {
  const { rows } = await db.query(
    "SELECT monthly_limit, alert_threshold FROM budget_settings WHERE user_id = $1",
    [userId]
  );
  if (!rows.length) return { enabled: false, monthly_limit: 0, remaining: 0, total_spent: 0 };
  const limit = toFloat(rows[0].monthly_limit);
  const { rows: spent } = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM expense_logs
     WHERE user_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)`,
    [userId]
  );
  const totalSpent = toFloat(spent[0].total);
  return {
    enabled: true,
    monthly_limit: limit,
    total_spent: totalSpent,
    remaining: parseFloat((limit - totalSpent).toFixed(2)),
    alert_threshold: toFloat(rows[0].alert_threshold || 80),
  };
}

// ── getOrders ─────────────────────────────────────────────────────────────────
async function getOrders({ db }, { userId, limit = 5 }) {
  const { rows: orders } = await db.query(
    `SELECT id, status, total_amount, created_at FROM orders
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  if (!orders.length) return [];
  const { rows: items } = await db.query(
    `SELECT order_id, product_id, name, quantity, price, line_total FROM order_items
     WHERE order_id = ANY($1::int[])`,
    [orders.map((o) => o.id)]
  );
  const itemsByOrder = items.reduce((acc, i) => {
    (acc[i.order_id] = acc[i.order_id] || []).push(i);
    return acc;
  }, {});
  return orders.map((o) => ({ ...o, total_amount: toFloat(o.total_amount), items: itemsByOrder[o.id] || [] }));
}

// ── checkout ──────────────────────────────────────────────────────────────────
async function checkout({ db, redis }, { userId }) {
  const cart = await getCart({ db }, { userId });
  if (!cart.items.length) throw Object.assign(new Error("Cart is empty"), { code: "EMPTY_CART" });

  const { rows: addrRows } = await db.query(
    "SELECT delivery_address FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  if (!addrRows.length || !addrRows[0].delivery_address) {
    throw Object.assign(new Error("No saved delivery address"), { code: "NO_ADDRESS" });
  }
  const address = addrRows[0].delivery_address;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const productIds = cart.items.map((i) => parseInt(i.product_id, 10));
    const { rows: priceRows } = await client.query(
      "SELECT id, name, price, category FROM products WHERE id = ANY($1::int[])",
      [productIds]
    );
    const productMap = new Map(priceRows.map((p) => [p.id, p]));

    let subtotal = 0;
    const lineItems = cart.items.map((item) => {
      const pid = parseInt(item.product_id, 10);
      const prod = productMap.get(pid);
      const price = prod ? toFloat(prod.price) : toFloat(item.price);
      const qty = Math.max(1, parseInt(item.quantity, 10));
      const lineTotal = parseFloat((price * qty).toFixed(2));
      subtotal += lineTotal;
      return { product_id: prod ? pid : null, name: prod ? prod.name : item.name, category: item.category, price, quantity: qty, line_total: lineTotal };
    });
    subtotal = parseFloat(subtotal.toFixed(2));

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, status, subtotal, discount, total_amount, delivery_address)
       VALUES ($1, 'confirmed', $2, 0, $2, $3) RETURNING *`,
      [userId, subtotal, JSON.stringify(address)]
    );

    for (const li of lineItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, category, price, quantity, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, li.product_id, li.name, li.category, li.price, li.quantity, li.line_total]
      );
    }

    const { rows: [session] } = await client.query(
      `INSERT INTO shopping_sessions (user_id, total_amount, total_spent, item_count, ended_at)
       VALUES ($1,$2,$2,$3,NOW()) RETURNING id`,
      [userId, subtotal, lineItems.length]
    );

    for (const li of lineItems) {
      if (li.product_id !== null) {
        await client.query(
          `INSERT INTO expense_logs (user_id, session_id, product_id, quantity, amount)
           VALUES ($1,$2,$3,$4,$5)`,
          [userId, session.id, li.product_id, li.quantity, li.line_total]
        );
      }
    }

    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
    await client.query("COMMIT");
    try { await redis.del(`cart:${userId}`); } catch {}

    return { orderId: order.id, total: subtotal, itemCount: lineItems.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { searchProducts, getCart, addToCart, removeFromCart, updateCart, getBudget, getOrders, checkout };

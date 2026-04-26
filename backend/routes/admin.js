"use strict";

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, query, validationResult } = require("express-validator");
const { requireAdmin } = require("../middleware/adminAuth");
const adminEvents = require("../utils/adminEvents");

const router = express.Router();

// ── Multer — image upload ─────────────────────────────────────────────────────

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `product-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"));
  },
});

// ── All admin routes require admin JWT ────────────────────────────────────────
router.use(requireAdmin);

// ── GET /api/admin/stats (rich) ──────────────────────────────────────────────
router.get("/stats", async (req, res, next) => {
  try {
    const db = req.app.get("db");

    const [products, users, orders, today, lowStock] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM products"),
      db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'"),
      db.query(`
        SELECT
          COUNT(*)::int                                                   AS total_orders,
          COALESCE(SUM(total_amount), 0)::numeric                        AS total_revenue,
          COALESCE(AVG(total_amount), 0)::numeric                        AS avg_order_value,
          COALESCE(SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END),0)::int AS pending_count,
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END),0)::int AS delivered_count,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END),0)::int AS cancelled_count
        FROM orders
      `),
      db.query(`
        SELECT
          COUNT(*)::int                               AS today_orders,
          COALESCE(SUM(total_amount), 0)::numeric     AS today_revenue
        FROM orders
        WHERE DATE(created_at AT TIME ZONE 'Asia/Kolkata') = CURRENT_DATE AT TIME ZONE 'Asia/Kolkata'
      `),
      db.query(`
        SELECT COUNT(*)::int AS low_stock_count
        FROM products
        WHERE stock IS NOT NULL AND stock <= 5
      `),
    ]);

    const o = orders.rows[0];
    const t = today.rows[0];

    res.json({
      totalProducts:   products.rows[0].count,
      totalUsers:      users.rows[0].count,
      totalOrders:     o.total_orders,
      totalRevenue:    parseFloat(o.total_revenue),
      avgOrderValue:   parseFloat(o.avg_order_value),
      pendingOrders:   o.pending_count,
      deliveredOrders: o.delivered_count,
      cancelledOrders: o.cancelled_count,
      todayOrders:     t.today_orders,
      todayRevenue:    parseFloat(t.today_revenue),
      lowStockCount:   lowStock.rows[0].low_stock_count,
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/events (SSE real-time stream) ──────────────────────────────
router.get("/events", (req, res) => {
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable Nginx/proxy buffering
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush(); // for compression middleware
  };

  send("connected", { ts: Date.now() });

  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 25000);

  const onNewOrder    = (d) => send("new_order",    d);
  const onOrderUpdate = (d) => send("order_update", d);
  const onStockUpdate = (d) => send("stock_update", d);
  const onInvoice     = (d) => send("invoice_ready",d);

  adminEvents.on("new_order",    onNewOrder);
  adminEvents.on("order_update", onOrderUpdate);
  adminEvents.on("stock_update", onStockUpdate);
  adminEvents.on("invoice_ready",onInvoice);

  req.on("close", () => {
    clearInterval(heartbeat);
    adminEvents.off("new_order",    onNewOrder);
    adminEvents.off("order_update", onOrderUpdate);
    adminEvents.off("stock_update", onStockUpdate);
    adminEvents.off("invoice_ready",onInvoice);
  });
});

// ── GET /api/admin/products ───────────────────────────────────────────────────
router.get(
  "/products",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const db = req.app.get("db");
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const hasSearch = search.length > 0;
      const baseWhere = hasSearch ? "WHERE name ILIKE $1 OR category ILIKE $1" : "";
      const searchParam = hasSearch ? [`%${search}%`] : [];

      const [productsResult, countResult] = await Promise.all([
        db.query(
          `SELECT id, name, price, category, stock, image_url, barcode, created_at
           FROM products
           ${baseWhere}
           ORDER BY id DESC
           LIMIT $${searchParam.length + 1} OFFSET $${searchParam.length + 2}`,
          [...searchParam, limit, offset]
        ),
        db.query(
          `SELECT COUNT(*)::int AS total FROM products ${baseWhere}`,
          searchParam
        ),
      ]);

      res.json({
        products: productsResult.rows,
        total: countResult.rows[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/admin/products ──────────────────────────────────────────────────
router.post(
  "/products",
  upload.single("image"),
  [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be a non-negative integer"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const { name, price, category, stock } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await db.query(
        `INSERT INTO products (name, price, category, stock, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, price, category, stock, image_url, barcode, created_at`,
        [name, parseFloat(price), category, parseInt(stock), imageUrl]
      );

      res.status(201).json({ product: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/admin/products/:id ───────────────────────────────────────────────
router.put(
  "/products/:id",
  upload.single("image"),
  [
    body("name").optional().trim().notEmpty(),
    body("price").optional().isFloat({ min: 0 }),
    body("category").optional().trim().notEmpty(),
    body("stock").optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const id = parseInt(req.params.id);
      const { name, price, category, stock } = req.body;

      const updates = [];
      const values = [];
      let idx = 1;

      if (name !== undefined)     { updates.push(`name = $${idx++}`);      values.push(name); }
      if (price !== undefined)    { updates.push(`price = $${idx++}`);     values.push(parseFloat(price)); }
      if (category !== undefined) { updates.push(`category = $${idx++}`);  values.push(category); }
      if (stock !== undefined)    { updates.push(`stock = $${idx++}`);     values.push(parseInt(stock)); }
      if (req.file)               { updates.push(`image_url = $${idx++}`); values.push(`/uploads/${req.file.filename}`); }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(id);
      const result = await db.query(
        `UPDATE products
         SET ${updates.join(", ")}
         WHERE id = $${idx}
         RETURNING id, name, price, category, stock, image_url, barcode, created_at`,
        values
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ product: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/admin/products/:id ────────────────────────────────────────────
router.delete("/products/:id", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const id = parseInt(req.params.id);

    const result = await db.query(
      "DELETE FROM products WHERE id = $1 RETURNING id, image_url",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Best-effort: remove uploaded image file from disk
    const imageUrl = result.rows[0].image_url;
    if (imageUrl?.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", imageUrl);
      fs.unlink(filePath, () => {});
    }

    res.json({ message: "Product deleted", id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/orders ─────────────────────────────────────────────────────
router.get("/orders", async (req, res, next) => {
  try {
    const db     = req.app.get("db");
    const limit  = Math.min(parseInt(req.query.limit,  10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0,  0);
    const status = req.query.status;

    const where  = status ? "WHERE o.status = $3" : "";
    const params = status ? [limit, offset, status] : [limit, offset];

    const [{ rows }, countRes] = await Promise.all([
      db.query(
        `SELECT
           o.id, o.user_id, o.status, o.subtotal, o.discount, o.total_amount,
           o.delivery_address, o.payment_method, o.created_at,
           u.first_name, u.last_name, u.email,
           COUNT(oi.id)::int AS item_count,
           inv.invoice_id, inv.storage_path AS invoice_path
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN invoices inv ON inv.order_id = o.id
         ${where}
         GROUP BY o.id, u.id, inv.invoice_id, inv.storage_path
         ORDER BY o.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      ),
      db.query(`SELECT COUNT(*)::int AS total FROM orders ${status ? "WHERE status = $1" : ""}`, status ? [status] : []),
    ]);
    res.json({ orders: rows, total: countRes.rows[0].total });
  } catch (err) { next(err); }
});

// ── PATCH /api/admin/orders/:id/status ───────────────────────────────────────
const VALID_STATUSES = ["pending","confirmed","processing","shipped","out_for_delivery","delivered","cancelled"];

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const db      = req.app.get("db");
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` });

    const { rows } = await db.query(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, orderId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
    adminEvents.emit("order_update", { orderId, status });
    res.json({ order: rows[0] });
  } catch (err) { next(err); }
});

// ── GET /api/admin/invoices ───────────────────────────────────────────────────
router.get("/invoices", async (req, res, next) => {
  try {
    const db     = req.app.get("db");
    const limit  = Math.min(parseInt(req.query.limit,  10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0,  0);

    const { rows } = await db.query(
      `SELECT
         inv.*, o.status AS order_status, o.total_amount,
         u.first_name, u.last_name, u.email
       FROM invoices inv
       JOIN orders o ON o.id = inv.order_id
       JOIN users u  ON u.id = inv.user_id
       ORDER BY inv.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ invoices: rows });
  } catch (err) { next(err); }
});

// ── GET /api/admin/invoices/:id/download ─────────────────────────────────────
router.get("/invoices/:id/download", async (req, res, next) => {
  try {
    const db  = req.app.get("db");
    const { streamInvoice } = require("../utils/gcsUpload");
    const { rows } = await db.query(
      "SELECT storage_path, invoice_id, file_size FROM invoices WHERE id = $1",
      [parseInt(req.params.id, 10)]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    const { storage_path, invoice_id, file_size } = rows[0];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice_id}.pdf"`);
    if (file_size) res.setHeader("Content-Length", file_size);
    await streamInvoice(storage_path, res);
  } catch (err) { next(err); }
});

module.exports = router;

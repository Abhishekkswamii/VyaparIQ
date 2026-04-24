"use strict";

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, query, validationResult } = require("express-validator");
const { requireAdmin } = require("../middleware/adminAuth");

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

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get("/stats", async (req, res, next) => {
  try {
    const db = req.app.get("db");

    const safeOrdersQuery = db
      .query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(SUM(total_amount), 0)::numeric AS revenue
         FROM orders`
      )
      .catch(() => ({ rows: [{ count: 0, revenue: "0" }] }));

    const [products, users, ordersResult] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM products"),
      db.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'"),
      safeOrdersQuery,
    ]);

    res.json({
      totalProducts: products.rows[0].count,
      totalUsers: users.rows[0].count,
      totalOrders: ordersResult.rows[0].count,
      totalRevenue: parseFloat(ordersResult.rows[0].revenue),
    });
  } catch (err) {
    next(err);
  }
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

module.exports = router;

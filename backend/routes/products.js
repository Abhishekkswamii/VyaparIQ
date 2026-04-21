const express = require("express");
const { query, validationResult } = require("express-validator");

const router = express.Router();

// GET /api/products — list all products (with optional category filter)
router.get("/", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const { category } = req.query;

    let sql = `
      SELECT p.*, ca.name AS cheaper_alternative_name, ca.price AS cheaper_alternative_price
      FROM products p
      LEFT JOIN products ca ON ca.id = p.cheaper_alternative_id
    `;
    const params = [];

    if (category) {
      sql += " WHERE p.category = $1";
      params.push(category);
    }

    sql += " ORDER BY p.category, p.name";

    const result = await db.query(sql, params);
    res.json({ products: result.rows, count: result.rows.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/search?q=<term>
router.get(
  "/search",
  [query("q").trim().notEmpty().withMessage("Search query 'q' is required")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const redis = req.app.get("redis");
      const searchTerm = req.query.q;

      // Check cache first
      const cacheKey = `search:${searchTerm.toLowerCase()}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const result = await db.query(
        `SELECT p.*, ca.name AS cheaper_alternative_name, ca.price AS cheaper_alternative_price
         FROM products p
         LEFT JOIN products ca ON ca.id = p.cheaper_alternative_id
         WHERE p.name ILIKE $1 OR p.category ILIKE $1 OR p.barcode = $2
         ORDER BY p.name`,
        [`%${searchTerm}%`, searchTerm]
      );

      const payload = { products: result.rows, count: result.rows.length };

      // Cache for 5 minutes
      await redis.set(cacheKey, JSON.stringify(payload), "EX", 300);

      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/products/barcode/:code — look up product by barcode
router.get("/barcode/:code", async (req, res, next) => {
  try {
    const db = req.app.get("db");
    const { code } = req.params;

    const result = await db.query(
      `SELECT p.*, ca.name AS cheaper_alternative_name, ca.price AS cheaper_alternative_price
       FROM products p
       LEFT JOIN products ca ON ca.id = p.cheaper_alternative_id
       WHERE p.barcode = $1`,
      [code]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

"use strict";

const express = require("express");
const router  = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { streamInvoice }     = require("../utils/gcsUpload");

// All invoice routes require a valid JWT
router.use(authenticateToken);

// ── GET /api/invoices/:orderId ─────────────────────────────────────────────────
// Return invoice metadata for an order (ownership enforced)
router.get("/:orderId", async (req, res, next) => {
  try {
    const db      = req.app.get("db");
    const orderId = parseInt(req.params.orderId, 10);
    if (!Number.isInteger(orderId) || orderId < 1)
      return res.status(400).json({ error: "Invalid order id" });

    const { rows } = await db.query(
      `SELECT inv.*
       FROM invoices inv
       JOIN orders o ON o.id = inv.order_id
       WHERE inv.order_id = $1 AND o.user_id = $2`,
      [orderId, req.user.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Invoice not found" });

    return res.json({ invoice: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/invoices/:orderId/download ───────────────────────────────────────
// Stream the PDF from GCS to the client (ownership enforced)
router.get("/:orderId/download", async (req, res, next) => {
  try {
    const db      = req.app.get("db");
    const orderId = parseInt(req.params.orderId, 10);
    if (!Number.isInteger(orderId) || orderId < 1)
      return res.status(400).json({ error: "Invalid order id" });

    const { rows } = await db.query(
      `SELECT inv.storage_path, inv.invoice_id, inv.file_size
       FROM invoices inv
       JOIN orders o ON o.id = inv.order_id
       WHERE inv.order_id = $1 AND o.user_id = $2`,
      [orderId, req.user.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Invoice not found" });

    const { storage_path, invoice_id, file_size } = rows[0];

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice_id}.pdf"`);
    if (file_size) res.setHeader("Content-Length", file_size);

    await streamInvoice(storage_path, res);
  } catch (err) {
    return next(err);
  }
});

// ── GET /api/invoices/:orderId/view ───────────────────────────────────────────
// Stream the PDF inline (for browser preview)
router.get("/:orderId/view", async (req, res, next) => {
  try {
    const db      = req.app.get("db");
    const orderId = parseInt(req.params.orderId, 10);
    if (!Number.isInteger(orderId) || orderId < 1)
      return res.status(400).json({ error: "Invalid order id" });

    const { rows } = await db.query(
      `SELECT inv.storage_path, inv.invoice_id
       FROM invoices inv
       JOIN orders o ON o.id = inv.order_id
       WHERE inv.order_id = $1 AND o.user_id = $2`,
      [orderId, req.user.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Invoice not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${rows[0].invoice_id}.pdf"`);
    await streamInvoice(rows[0].storage_path, res);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

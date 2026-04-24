"use strict";

const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const {
  createOrder,
  getUserOrders,
  getOrderById,
} = require("../controllers/orders.controller");

const router = express.Router();

// All order routes require a valid JWT
router.use(authenticateToken);

// ── Validation helpers ────────────────────────────────────────────────────────

const addressRules = [
  body("address.name")
    .trim()
    .notEmpty()
    .withMessage("Delivery name is required"),
  body("address.phone")
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Phone must be a 10-digit number"),
  body("address.address")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Street address must be at least 10 characters"),
  body("address.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("address.pincode")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be a 6-digit number"),
];

const itemsRules = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("items must be a non-empty array"),
  body("items.*.product_id")
    .notEmpty()
    .withMessage("Each item must have a product_id"),
  body("items.*.name")
    .trim()
    .notEmpty()
    .withMessage("Each item must have a name"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Each item price must be >= 0"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Each item quantity must be >= 1"),
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("discount must be >= 0"),
];

// Middleware: return 400 if any validation rule failed
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/orders — place a new order
// Body: { items, discount?, address }
router.post(
  "/",
  [...addressRules, ...itemsRules],
  validate,
  createOrder
);

// GET /api/orders — paginated order history
// Query: ?limit=20&offset=0
router.get(
  "/",
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be between 1 and 100"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("offset must be >= 0"),
  ],
  validate,
  getUserOrders
);

// GET /api/orders/:id — single order with full item breakdown
router.get("/:id", getOrderById);

module.exports = router;

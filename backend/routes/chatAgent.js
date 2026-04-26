"use strict";

const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const agent = require("../ai/agent");

const router = express.Router();
router.use(authenticateToken);

router.post(
  "/",
  [body("message").trim().notEmpty().withMessage("message is required")],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { message, ocr_text } = req.body;
      const effectiveMessage = ocr_text ? `${message}\nOCR: ${ocr_text}` : message;

      const result = await agent.run(
        effectiveMessage,
        req.user.id,
        req.app.get("db"),
        req.app.get("redis")
      );

      return res.json(result);
    } catch (err) {
      if (err.code === "NO_API_KEY") {
        console.error("[Vyra] GEMINI_API_KEY is not set in environment.");
        return res.json({
          reply: "Vyra isn't configured yet. Ask your admin to set the GEMINI_API_KEY environment variable and restart the backend.",
          intent: "UNKNOWN",
          actions: [],
          needs_choice: false,
          options: [],
          cart: { items: [], total: 0, itemCount: 0 },
          budget: { enabled: false, monthly_limit: 0, remaining: 0, willExceed: false },
        });
      }
      next(err);
    }
  }
);

module.exports = router;

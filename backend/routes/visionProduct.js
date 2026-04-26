const express = require("express");
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function toFloat(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const s = normalize(a);
  const t = normalize(b);
  if (!s) return t.length;
  if (!t) return s.length;
  const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));
  for (let i = 0; i <= s.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= t.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[s.length][t.length];
}

async function getCartSnapshot(db, userId) {
  const result = await db.query(
    `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.category, p.image_url, p.barcode,
            (ci.quantity * p.price) AS subtotal
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1
     ORDER BY ci.added_at DESC`,
    [userId]
  );
  const items = result.rows.map((row) => ({
    ...row,
    price: toFloat(row.price),
    subtotal: toFloat(row.subtotal),
  }));
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const itemCount = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  return { items, total, itemCount };
}

async function getBudgetSnapshot(db, userId) {
  const result = await db.query(
    "SELECT monthly_limit FROM budget_settings WHERE user_id = $1",
    [userId]
  );
  if (!result.rows.length) return { enabled: false, monthly_limit: 0, remaining: 0 };
  const monthly_limit = toFloat(result.rows[0].monthly_limit);
  const spentResult = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_spent
     FROM expense_logs
     WHERE user_id = $1
       AND created_at >= date_trunc('month', CURRENT_DATE)`,
    [userId]
  );
  const spent = toFloat(spentResult.rows[0].total_spent);
  return { enabled: true, monthly_limit, remaining: monthly_limit - spent };
}

async function detectWithGeminiVision(file) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `
Identify the main retail product in this image.
Return strict JSON:
{
  "product_name": "string",
  "brand": "string",
  "category": "string",
  "confidence": number
}
Use empty string if unknown. Confidence is 0..1.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.mimetype || "image/jpeg",
                data: file.buffer.toString("base64"),
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini Vision failed (${response.status}): ${errText || "unknown error"}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse Gemini response");
    return JSON.parse(match[0]);
  }
}

async function resolveProductMatches(db, vision) {
  const productName = String(vision.product_name || "").trim();
  const brand = String(vision.brand || "").trim();
  const category = String(vision.category || "").trim();

  const exact = await db.query(
    `SELECT id, name, price, category, image_url, barcode
     FROM products
     WHERE LOWER(name) = LOWER($1)
     LIMIT 1`,
    [productName]
  );
  if (exact.rows.length) return { strategy: "exact_match", matches: exact.rows };

  const fuzzyRows = await db.query(
    `SELECT id, name, price, category, image_url, barcode
     FROM products
     WHERE name ILIKE $1
        OR ($2 <> '' AND name ILIKE $2)
        OR ($3 <> '' AND category ILIKE $3)
     LIMIT 40`,
    [`%${productName}%`, brand ? `%${brand}%` : "", category ? `%${category}%` : ""]
  );

  const fuzzyRanked = fuzzyRows.rows
    .map((r) => {
      const nameScore = levenshtein(productName || brand || category, r.name);
      const normLen = Math.max(normalize(r.name).length, 1);
      const fuzzyScore = 1 - Math.min(nameScore / normLen, 1);
      const catBoost =
        category && normalize(r.category).includes(normalize(category)) ? 0.15 : 0;
      return { ...r, _score: fuzzyScore + catBoost };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  if (fuzzyRanked.length && fuzzyRanked[0]._score >= 0.72) {
    return { strategy: "fuzzy_match", matches: [fuzzyRanked[0]] };
  }
  if (fuzzyRanked.length > 1) {
    return { strategy: "multiple_matches", matches: fuzzyRanked.slice(0, 3) };
  }

  if (category) {
    const categoryRows = await db.query(
      `SELECT id, name, price, category, image_url, barcode
       FROM products
       WHERE category ILIKE $1
       ORDER BY price ASC
       LIMIT 3`,
      [`%${category}%`]
    );
    if (categoryRows.rows.length === 1) {
      return { strategy: "category_match", matches: categoryRows.rows };
    }
    if (categoryRows.rows.length > 1) {
      return { strategy: "multiple_matches", matches: categoryRows.rows };
    }
  }

  return { strategy: "no_match", matches: [] };
}

router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required (field: image)" });
    }
    const db = req.app.get("db");
    const redis = req.app.get("redis");
    const userId = req.user.id;
    const quantity = Math.max(1, Number(req.body.quantity || 1));
    const selectedProductId = Number(req.body.selected_product_id || 0);

    const vision = await detectWithGeminiVision(req.file);
    const matchResult = await resolveProductMatches(db, vision);
    let matches = matchResult.matches || [];
    let strategy = matchResult.strategy;

    if (selectedProductId > 0) {
      const selected = matches.find((m) => Number(m.id) === selectedProductId);
      if (selected) {
        matches = [selected];
        strategy = "manual_selected";
      }
    }

    let actions = [];
    let reply = "";

    if (matches.length === 1) {
      const selected = matches[0];
      await db.query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + $3, added_at = NOW()`,
        [userId, selected.id, quantity]
      );
      actions.push({
        type: "added",
        product_id: selected.id,
        name: selected.name,
        quantity,
        price: toFloat(selected.price),
      });
      reply = `Added ${quantity} x ${selected.name} to your cart from camera detection.`;
    } else if (matches.length > 1) {
      reply = `I found multiple possible products. Please choose one:\n${matches
        .map((m, i) => `${i + 1}. ${m.name} (₹${toFloat(m.price).toFixed(2)})`)
        .join("\n")}`;
    } else {
      reply = "This item is currently unavailable in our catalog.";
    }

    await redis.del(`cart:${userId}`);
    const cart = await getCartSnapshot(db, userId);
    const budget = await getBudgetSnapshot(db, userId);
    const willExceed = budget.enabled ? cart.total > budget.remaining : false;

    res.json({
      reply,
      strategy,
      detected: {
        product_name: String(vision.product_name || ""),
        brand: String(vision.brand || ""),
        category: String(vision.category || ""),
        confidence: toFloat(vision.confidence),
      },
      options: matches.slice(0, 3).map((m) => ({
        id: m.id,
        name: m.name,
        price: toFloat(m.price),
        category: m.category,
      })),
      actions,
      cart: {
        items: cart.items,
        total: Number(cart.total.toFixed(2)),
        itemCount: cart.itemCount,
      },
      budget: {
        enabled: budget.enabled,
        monthly_limit: Number((budget.monthly_limit || 0).toFixed(2)),
        remaining: Number((budget.remaining || 0).toFixed(2)),
        willExceed,
      },
    });
  } catch (err) {
    if (err?.message?.includes("Only image uploads are allowed")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;

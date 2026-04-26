const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MEMORY_TTL_SECONDS = 60 * 30;
const PRODUCT_CATALOG_LIMIT = 400;

function toFloat(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function titleCase(s) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

function parseJsonFromText(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function parseItemsRuleBased(message) {
  const normalized = message
    .toLowerCase()
    .replace(/[,+]/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
  const chunks = normalized
    .split(/\band\b/)
    .map((s) => s.trim())
    .filter(Boolean);

  return chunks.map((chunk) => {
    const qtyMatch = chunk.match(/(\d+)\s*(x|qty|quantity)?/);
    const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;
    const name = chunk
      .replace(/^\b(add|remove|delete|update|set|put)\b/i, "")
      .replace(/\b(to|from|my|cart|please|the|a|an|item|in|into|for)\b/gi, "")
      .replace(/(\d+)\s*(x|qty|quantity)?/gi, "")
      .trim();
    return {
      name: titleCase(name),
      quantity: Math.max(1, quantity),
    };
  }).filter((item) => item.name);
}

async function runGeminiJson(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseJsonFromText(text);
  } catch {
    return null;
  }
}

async function runGeminiIntent(message, memory) {
  if (!process.env.GEMINI_API_KEY) return null;
  const prompt = `
You are an intent parser for a shopping chatbot.
Return JSON only with schema:
{
  "intent": "add_to_cart|remove_from_cart|update_quantity|view_cart|budget_check|recommendations|unknown",
  "items": [{"name":"string","quantity":number}],
  "budget_query": boolean,
  "reference": "string|null"
}
User message: ${JSON.stringify(message)}
Previous references: ${JSON.stringify(memory.lastProductMentions || [])}
`;
  return runGeminiJson(prompt);
}

async function extractShoppingItemsWithGemini(message, memory) {
  const prompt = `
You are an NLP extractor for a shopping assistant.
Understand multilingual user language (English/Hinglish/Hindi).
Return strict JSON only:
{
  "items": [{"name":"string","quantity":number}],
  "notes":"string"
}
Rules:
- Extract product names user wants to buy.
- Ignore helper words like add/cart/please.
- Quantity defaults to 1.
- If no clear product names, return empty items array.
User message: ${JSON.stringify(message)}
Recent referenced products: ${JSON.stringify(memory.lastProductMentions || [])}
`;
  const data = await runGeminiJson(prompt);
  if (!data || !Array.isArray(data.items)) return [];
  return data.items
    .map((x) => ({
      name: titleCase(String(x?.name || "").trim()),
      quantity: Math.max(1, Number(x?.quantity || 1)),
    }))
    .filter((x) => x.name);
}

async function loadProductCatalog(db) {
  const result = await db.query(
    `SELECT id, name, price, category, image_url, barcode
     FROM products
     ORDER BY name ASC
     LIMIT $1`,
    [PRODUCT_CATALOG_LIMIT]
  );
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: toFloat(r.price),
    category: r.category,
    image_url: r.image_url,
    barcode: r.barcode,
  }));
}

async function resolveProductWithGemini(query, catalog) {
  if (!query || !catalog.length) return null;
  const compact = catalog.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
  }));
  const prompt = `
You are a product matcher.
Given a user request and available product catalog, choose best matching product IDs.
Return strict JSON only:
{
  "exact_match_id": number|null,
  "candidates": [number],
  "confidence": number
}
Rules:
- Use meaning similarity, synonyms, and multilingual understanding.
- If uncertain, return top 3 candidates in ranked order.
- If no relevant match, return empty candidates.
User request: ${JSON.stringify(query)}
Catalog: ${JSON.stringify(compact)}
`;
  const data = await runGeminiJson(prompt);
  if (!data) return null;
  const candidates = Array.isArray(data.candidates)
    ? data.candidates.map((x) => Number(x)).filter((x) => Number.isFinite(x))
    : [];
  const exactId = Number(data.exact_match_id);
  return {
    exact_match_id: Number.isFinite(exactId) ? exactId : null,
    candidates,
    confidence: toFloat(data.confidence),
  };
}
async function getBudgetSnapshot(db, userId) {
  const result = await db.query(
    "SELECT monthly_limit, alert_threshold FROM budget_settings WHERE user_id = $1",
    [userId]
  );
  if (!result.rows.length) {
    return { enabled: false, monthly_limit: 0, alert_threshold: 80, remaining: 0 };
  }

  const budget = result.rows[0];
  const spentResult = await db.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_spent
     FROM expense_logs
     WHERE user_id = $1
       AND created_at >= date_trunc('month', CURRENT_DATE)`,
    [userId]
  );
  const spent = toFloat(spentResult.rows[0].total_spent);
  const limit = toFloat(budget.monthly_limit);
  return {
    enabled: true,
    monthly_limit: limit,
    alert_threshold: toFloat(budget.alert_threshold || 80),
    total_spent: spent,
    remaining: limit - spent,
  };
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

async function searchProducts(db, rawTerm) {
  const term = String(rawTerm || "").trim();
  if (!term) return [];
  const normalized = `%${term}%`;

  const runSearch = async (lookupTerm, exactTerm) => {
    const result = await db.query(
      `SELECT p.id, p.name, p.price, p.category, p.image_url, p.barcode,
              p.cheaper_alternative_id,
              ca.id AS cheaper_id,
              ca.name AS cheaper_name,
              ca.price AS cheaper_price
       FROM products p
       LEFT JOIN products ca ON ca.id = p.cheaper_alternative_id
       WHERE p.name ILIKE $1 OR p.category ILIKE $1 OR p.barcode = $2
       ORDER BY
         CASE
           WHEN LOWER(p.name) = LOWER($2) THEN 0
           WHEN p.name ILIKE $3 THEN 1
           ELSE 2
         END,
         p.price ASC,
         p.name ASC
       LIMIT 5`,
      [lookupTerm, exactTerm, `${exactTerm}%`]
    );
    return result.rows;
  };

  let rows = await runSearch(normalized, term);
  if (!rows.length) {
    const simplified = term
      .toLowerCase()
      .replace(/\b(add|remove|delete|update|set|put|to|from|my|cart|please|the|a|an|item|in|into|for)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (simplified && simplified !== term.toLowerCase()) {
      rows = await runSearch(`%${simplified}%`, simplified);
    }
  }

  return rows.map((r) => ({
    ...r,
    price: toFloat(r.price),
    cheaper_price: toFloat(r.cheaper_price),
  }));
}

function pickCatalogByIds(catalog, ids) {
  const map = new Map(catalog.map((c) => [Number(c.id), c]));
  return ids.map((id) => map.get(Number(id))).filter(Boolean);
}

function detectIntentFallback(message) {
  const text = String(message || "").toLowerCase();
  if (/\b(view|show|what.*cart|cart status|my cart)\b/.test(text)) return "view_cart";
  if (/\b(budget|remaining|left|over budget)\b/.test(text)) return "budget_check";
  if (/\b(recommend|suggest|alternative|deals?)\b/.test(text)) return "recommendations";
  if (/\b(remove|delete)\b/.test(text)) return "remove_from_cart";
  if (/\b(update|change|set)\b/.test(text) && /\b(qty|quantity|\d+)\b/.test(text))
    return "update_quantity";
  if (/\b(add|buy|get|put)\b/.test(text)) return "add_to_cart";
  return "unknown";
}

router.post(
  "/",
  [body("message").trim().notEmpty().withMessage("message is required")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = req.app.get("db");
      const redis = req.app.get("redis");
      const userId = req.user.id;
      const message = req.body.message;
      const ocrText = String(req.body.ocr_text || "").trim();
      const effectiveMessage = ocrText ? `${message}\nOCR: ${ocrText}` : message;
      const memoryKey = `chat-agent:${userId}`;
      const memoryRaw = (await redis.get(memoryKey)) || "{}";
      const memory = parseJsonFromText(memoryRaw) || {};
      const catalog = await loadProductCatalog(db);

      const llm = await runGeminiIntent(effectiveMessage, memory);
      let intent = llm?.intent || detectIntentFallback(message);
      let parsedItems =
        Array.isArray(llm?.items) && llm.items.length ? llm.items : parseItemsRuleBased(message);
      if (intent === "add_to_cart" && (!parsedItems.length || parsedItems.every((i) => !i?.name))) {
        const geminiItems = await extractShoppingItemsWithGemini(effectiveMessage, memory);
        if (geminiItems.length) parsedItems = geminiItems;
      }

      const toolCalls = [];
      const actions = [];
      let reply = "";
      let needsChoice = false;
      let choiceOptions = [];

      // Resolve pending disambiguation choice from memory
      if (memory.pendingChoice && /^\d+$/.test(String(message).trim())) {
        const idx = Number(String(message).trim()) - 1;
        const selected = memory.pendingChoice.options[idx];
        if (selected) {
          intent = memory.pendingChoice.intent || "add_to_cart";
          toolCalls.push({ tool: "resolve_choice", selected: selected.name });
          parsedItems.splice(0, parsedItems.length, {
            name: selected.name,
            quantity: memory.pendingChoice.quantity || 1,
          });
        }
      }

      // Short follow-ups like "add" should reuse the last mentioned product.
      if (intent === "add_to_cart" && parsedItems.length === 0 && Array.isArray(memory.lastProductMentions)) {
        if (memory.lastProductMentions[0]) {
          parsedItems.push({ name: memory.lastProductMentions[0], quantity: 1 });
        }
      }

      if (intent === "add_to_cart") {
        for (const item of parsedItems) {
          if (!item?.name) continue;
          toolCalls.push({ tool: "search_products", query: item.name });
          let matches = await searchProducts(db, item.name);
          if (!matches.length) {
            const geminiResolved = await resolveProductWithGemini(item.name, catalog);
            if (geminiResolved?.exact_match_id) {
              matches = pickCatalogByIds(catalog, [geminiResolved.exact_match_id]);
            } else if (geminiResolved?.candidates?.length) {
              matches = pickCatalogByIds(catalog, geminiResolved.candidates.slice(0, 5));
            }
          }
          if (!matches.length) {
            actions.push({ type: "not_found", item: item.name });
            continue;
          }

          const exact = matches.find((m) => m.name.toLowerCase() === String(item.name).toLowerCase());
          if (!exact && matches.length > 1) {
            needsChoice = true;
            choiceOptions = matches.slice(0, 3).map((m) => ({
              id: m.id,
              name: m.name,
              price: m.price,
            }));
            memory.pendingChoice = {
              intent: "add_to_cart",
              quantity: item.quantity || 1,
              options: choiceOptions,
            };
            break;
          }

          const selected = exact || matches[0];
          const quantity = Math.max(1, Number(item.quantity || 1));
          toolCalls.push({
            tool: "add_to_cart",
            product_id: selected.id,
            quantity,
          });
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
            price: selected.price,
          });
          memory.lastProductMentions = [selected.name, ...(memory.lastProductMentions || [])].slice(0, 6);
          delete memory.pendingChoice;
        }
      } else if (intent === "remove_from_cart") {
        const term = parsedItems[0]?.name || llm?.reference || message;
        const cart = await getCartSnapshot(db, userId);
        const target = cart.items.find((i) => i.name.toLowerCase().includes(String(term).toLowerCase()));
        if (!target) {
          actions.push({ type: "not_found_in_cart", item: term });
        } else {
          toolCalls.push({ tool: "remove_from_cart", product_id: target.product_id });
          await db.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [userId, target.product_id]);
          actions.push({ type: "removed", name: target.name });
        }
      } else if (intent === "update_quantity") {
        const term = parsedItems[0]?.name || llm?.reference || message;
        const qty = Math.max(1, Number(parsedItems[0]?.quantity || 1));
        const cart = await getCartSnapshot(db, userId);
        const target = cart.items.find((i) => i.name.toLowerCase().includes(String(term).toLowerCase()));
        if (!target) {
          actions.push({ type: "not_found_in_cart", item: term });
        } else {
          toolCalls.push({ tool: "update_quantity", product_id: target.product_id, quantity: qty });
          await db.query(
            "UPDATE cart_items SET quantity = $1, added_at = NOW() WHERE user_id = $2 AND product_id = $3",
            [qty, userId, target.product_id]
          );
          actions.push({ type: "quantity_updated", name: target.name, quantity: qty });
        }
      } else if (intent === "recommendations") {
        const budget = await getBudgetSnapshot(db, userId);
        toolCalls.push({ tool: "recommendations", remaining: budget.remaining });
        const result = await db.query(
          `SELECT id, name, price, category
           FROM products
           WHERE price <= $1
           ORDER BY price ASC
           LIMIT 4`,
          [Math.max(80, budget.enabled ? budget.remaining : 200)]
        );
        actions.push({ type: "recommendations", items: result.rows });
      } else if (intent === "view_cart") {
        toolCalls.push({ tool: "view_cart" });
      } else if (intent === "budget_check") {
        toolCalls.push({ tool: "budget_check" });
      }

      const cart = await getCartSnapshot(db, userId);
      const budget = await getBudgetSnapshot(db, userId);
      const willExceed = budget.enabled ? cart.total > budget.remaining : false;

      if (needsChoice) {
        reply = `I found multiple matches. Reply with a number:\n${choiceOptions
          .map((o, i) => `${i + 1}. ${o.name} (₹${o.price})`)
          .join("\n")}`;
      } else if (actions.some((a) => a.type === "added")) {
        const added = actions
          .filter((a) => a.type === "added")
          .map((a) => `${a.quantity} x ${a.name}`)
          .join(", ");
        reply = `Added ${added} to your cart. Cart total is now ₹${cart.total.toFixed(2)}.`;
      } else if (actions.some((a) => a.type === "removed")) {
        reply = "Removed item from your cart.";
      } else if (actions.some((a) => a.type === "quantity_updated")) {
        reply = "Updated quantity in your cart.";
      } else if (intent === "view_cart") {
        reply =
          cart.items.length === 0
            ? "Your cart is empty."
            : `You have ${cart.itemCount} items worth ₹${cart.total.toFixed(2)} in your cart.`;
      } else if (intent === "budget_check") {
        reply = budget.enabled
          ? `Budget remaining: ₹${budget.remaining.toFixed(2)} out of ₹${budget.monthly_limit.toFixed(2)}.`
          : "No budget set yet. Set one to track spending.";
      } else if (actions.some((a) => a.type === "recommendations")) {
        const rec = actions.find((a) => a.type === "recommendations");
        reply = `Here are affordable picks:\n${rec.items
          .map((i) => `- ${i.name} (₹${toFloat(i.price).toFixed(2)})`)
          .join("\n")}`;
      } else if (actions.some((a) => a.type === "not_found")) {
        reply = "I could not find that product in the current catalog. Try another name, brand, or category.";
      } else {
        reply = "Tell me to add, remove, update quantity, view cart, check budget, or suggest recommendations.";
      }

      if (willExceed) {
        const expensive = cart.items
          .slice()
          .sort((a, b) => b.price - a.price)
          .slice(0, 2);
        let cheaper = [];
        for (const item of expensive) {
          const altResult = await db.query(
            `SELECT id, name, price FROM products
             WHERE category = $1 AND price < $2
             ORDER BY price ASC LIMIT 1`,
            [item.category, item.price]
          );
          if (altResult.rows[0]) {
            cheaper.push({ for: item.name, alternative: altResult.rows[0] });
          }
        }
        if (cheaper.length) {
          reply += `\nYou're over budget. Cheaper alternatives: ${cheaper
            .map((c) => `${c.alternative.name} (₹${toFloat(c.alternative.price).toFixed(2)}) instead of ${c.for}`)
            .join("; ")}.`;
        } else {
          reply += "\nWarning: this cart exceeds your remaining budget.";
        }
      }

      await redis.set(memoryKey, JSON.stringify(memory), "EX", MEMORY_TTL_SECONDS);
      await redis.del(`cart:${userId}`);

      res.json({
        reply,
        intent,
        tool_calls: toolCalls,
        actions,
        needs_choice: needsChoice,
        options: choiceOptions,
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
      next(err);
    }
  }
);

module.exports = router;

"use strict";

// Gemini API wrapper — intent extraction + response generation.
// All Gemini calls include retry logic with exponential backoff.

const { INTENT_EXTRACTION_SYSTEM, RESPONSE_GENERATION_SYSTEM } = require("./prompts");
const { INTENTS } = require("./intents");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

// ── Core Gemini caller with retry ─────────────────────────────────────────────

async function callGemini(systemInstruction, userContent, { jsonMode = false, temperature = 0.7, maxTokens = 512 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY not set"), { code: "NO_API_KEY" });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = Object.assign(
          new Error(`Gemini HTTP ${res.status}`),
          { code: "GEMINI_HTTP_ERROR", status: res.status, detail: body.slice(0, 400) }
        );
        console.error(`[Vyra:planner] Attempt ${attempt}/${MAX_RETRIES} — ${err.message} — model:${GEMINI_MODEL} — ${err.detail}`);
        if (res.status === 400 || res.status === 403) throw err; // non-retryable
        lastErr = err;
      } else {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw Object.assign(new Error("Empty Gemini response"), { code: "EMPTY_RESPONSE" });
        return text.trim();
      }
    } catch (err) {
      if (err.code === "GEMINI_HTTP_ERROR" && (err.status === 400 || err.status === 403)) throw err;
      lastErr = err;
      console.error(`[Vyra:planner] Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** (attempt - 1)));
    }
  }
  throw lastErr;
}

function safeParseJson(text) {
  const s = String(text || "").trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return null;
}

// ── Intent extraction ─────────────────────────────────────────────────────────

async function extractIntent(message, recentTasks = []) {
  const taskContext = recentTasks.length
    ? `\nRecent agent tasks (last ${recentTasks.length}): ${recentTasks.map((t) => t.intent).join(", ")}`
    : "";
  const userContent = `User message: ${JSON.stringify(message)}${taskContext}`;

  let text;
  try {
    text = await callGemini(INTENT_EXTRACTION_SYSTEM, userContent, { jsonMode: true, temperature: 0.1, maxTokens: 300 });
  } catch (err) {
    if (err.code === "NO_API_KEY") throw err;
    console.error("[Vyra:planner] extractIntent failed after retries:", err.message);
    return null; // caller handles null → agent.js uses a safe default
  }

  const parsed = safeParseJson(text);
  if (!parsed?.intent) return null;

  const intent = Object.values(INTENTS).includes(parsed.intent) ? parsed.intent : INTENTS.UNKNOWN;
  return {
    intent,
    entities: {
      items: Array.isArray(parsed.entities?.items) ? parsed.entities.items : [],
      category: parsed.entities?.category || null,
      reference: parsed.entities?.reference || null,
    },
    confidence: Number(parsed.confidence) || 0,
  };
}

// ── Response generation ───────────────────────────────────────────────────────

async function generateResponse(userMessage, intent, entities, executionResult) {
  const ctx = {
    userMessage,
    intent,
    actions: executionResult.actions,
    cart_total: executionResult.cart?.total,
    cart_items: executionResult.cart?.itemCount,
    budget_remaining: executionResult.budget?.remaining,
    budget_enabled: executionResult.budget?.enabled,
    needs_disambig: executionResult.needsDisambig,
    options: executionResult.options,
  };
  const userContent = `User said: ${JSON.stringify(userMessage)}\nExecution context: ${JSON.stringify(ctx)}`;

  try {
    return await callGemini(RESPONSE_GENERATION_SYSTEM, userContent, { temperature: 0.7, maxTokens: 200 });
  } catch (err) {
    if (err.code === "NO_API_KEY") throw err;
    console.error("[Vyra:planner] generateResponse failed after retries:", err.message);
    return null; // agent.js will use structural fallback
  }
}

module.exports = { extractIntent, generateResponse };

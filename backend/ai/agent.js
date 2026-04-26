"use strict";

// Vyra Agent Runtime — orchestrates the full pipeline:
//   Input → Gemini intent extraction → Tool execution → Gemini response generation → Task log

const planner  = require("./planner");
const executor = require("./executor");
const memory   = require("./memory");
const { INTENTS } = require("./intents");

// ── Structural fallback (only used when Gemini response generation fails) ──────
// NOT a chatbot fallback — only fires on API failure, gives the raw action result.

function structuralFallback(intent, executionResult) {
  const { actions, cart, budget } = executionResult;

  const added = actions.filter((a) => a.type === "ADDED");
  if (added.length) {
    const names = added.map((a) => `${a.quantity}x ${a.name}`).join(", ");
    let msg = `✅ Added ${names} to your cart. Total: ₹${cart.total.toFixed(0)}.`;
    if (budget.enabled && cart.total > budget.remaining) {
      msg += ` ⚠️ Cart exceeds remaining budget (₹${budget.remaining.toFixed(0)}).`;
    }
    return msg;
  }
  if (actions.some((a) => a.type === "REMOVED"))      return `✅ Removed from cart. Total: ₹${cart.total.toFixed(0)}.`;
  if (actions.some((a) => a.type === "QUANTITY_UPDATED")) {
    const a = actions.find((a) => a.type === "QUANTITY_UPDATED");
    return `✅ Updated ${a.name} → ${a.quantity} units.`;
  }
  if (actions.some((a) => a.type === "CHECKOUT_COMPLETE")) {
    const a = actions.find((a) => a.type === "CHECKOUT_COMPLETE");
    return `📦 Order #${a.orderId} confirmed! Total: ₹${a.total.toFixed(0)}. Thank you!`;
  }
  if (actions.some((a) => a.type === "CHECKOUT_NEEDS_ADDRESS")) {
    return "🛒 Please complete checkout from the cart page to add your delivery address.";
  }
  if (actions.some((a) => a.type === "CHECKOUT_FAILED")) return "Your cart is empty. Add some items first!";
  if (actions.some((a) => a.type === "AMBIGUOUS")) {
    const a = actions.find((a) => a.type === "AMBIGUOUS");
    const list = executionResult.options.map((o, i) => `${i + 1}. ${o.name} (₹${o.price})`).join("\n");
    return `Found multiple matches for "${a.item}". Which one?\n${list}`;
  }
  if (actions.some((a) => a.type === "NOT_FOUND"))    return "❌ Product not found. Try a different name.";
  if (actions.some((a) => a.type === "REORDER_FAILED")) return "No previous orders found. Start shopping first!";
  if (intent === INTENTS.VIEW_CART) {
    return cart.itemCount > 0
      ? `🛒 ${cart.itemCount} items · ₹${cart.total.toFixed(0)}`
      : "Your cart is empty 🛒";
  }
  if (intent === INTENTS.CHECK_BUDGET) {
    return budget.enabled
      ? `💰 ₹${budget.remaining.toFixed(0)} remaining of ₹${budget.monthly_limit.toFixed(0)} budget.`
      : "No budget set. Configure one on the Overview page.";
  }
  if (intent === INTENTS.GREETING) {
    return cart.itemCount > 0
      ? `Hey! 👋 I'm Vyra. You have ${cart.itemCount} item${cart.itemCount > 1 ? "s" : ""} in cart. What can I add?`
      : "Hey! 👋 I'm Vyra, your AI shopping agent. Tell me what to add ✨";
  }
  return "I can add items, search products, check your budget, or place orders — just ask!";
}

// ── Main agent run ─────────────────────────────────────────────────────────────

async function run(message, userId, db, redis) {
  const ctx = { db, redis, userId };

  // ── 1. Check for pending disambiguation (user replying with a number) ────────
  const pending = await memory.getPending(redis, userId);
  if (pending && /^\s*\d+\s*$/.test(message)) {
    const idx = parseInt(message.trim(), 10) - 1;
    const execResult = await executor.handleDisambigResolution(ctx, pending, idx);
    await memory.clearPending(redis, userId);
    if (execResult.logWorthy) {
      await memory.logTask(redis, userId, {
        intent: INTENTS.ADD_TO_CART,
        items: execResult.actions.filter((a) => a.type === "ADDED").map((a) => a.name),
        actions: execResult.actions,
      });
    }
    const reply = await planner.generateResponse(message, INTENTS.ADD_TO_CART, {}, execResult)
                  ?? structuralFallback(INTENTS.ADD_TO_CART, execResult);
    return buildResponse(reply, INTENTS.ADD_TO_CART, execResult);
  }

  // ── 2. Extract intent via Gemini ─────────────────────────────────────────────
  const recentTasks = await memory.getRecentTasks(redis, userId);
  let parsed;
  try {
    parsed = await planner.extractIntent(message, recentTasks);
  } catch (err) {
    if (err.code === "NO_API_KEY") {
      throw Object.assign(new Error("Gemini API key is not configured"), { code: "NO_API_KEY" });
    }
    throw err;
  }

  // If Gemini returned null (all retries exhausted), fall through with UNKNOWN
  const intent   = parsed?.intent   ?? INTENTS.UNKNOWN;
  const entities = parsed?.entities ?? { items: [], category: null, reference: null };
  const confidence = parsed?.confidence ?? 0;
  console.log(`[Vyra:agent] intent=${intent} confidence=${confidence.toFixed(2)} user=${userId}`);

  // ── 3. Execute tools ─────────────────────────────────────────────────────────
  const execResult = await executor.execute(intent, entities, ctx, pending);

  // ── 4. Manage pending state ──────────────────────────────────────────────────
  if (execResult.needsDisambig) {
    await memory.setPending(redis, userId, {
      intent,
      options: execResult.options,
      quantity: entities.items?.[0]?.quantity ?? 1,
    });
  } else {
    await memory.clearPending(redis, userId);
  }

  // ── 5. Generate response via Gemini ─────────────────────────────────────────
  const geminiReply = await planner.generateResponse(message, intent, entities, execResult);
  const reply = geminiReply ?? structuralFallback(intent, execResult);

  // ── 6. Log task (not chat history) ──────────────────────────────────────────
  if (execResult.logWorthy) {
    await memory.logTask(redis, userId, {
      intent,
      items: entities.items?.map((i) => i.name) ?? [],
      actions: execResult.actions,
    });
  }

  return buildResponse(reply, intent, execResult);
}

function buildResponse(reply, intent, execResult) {
  const { actions, cart, budget, needsDisambig, options } = execResult;
  return {
    reply,
    intent,
    actions,
    needs_choice: needsDisambig,
    options,
    cart: {
      items: cart.items,
      total: cart.total,
      itemCount: cart.itemCount,
    },
    budget: {
      enabled: budget.enabled,
      monthly_limit: budget.monthly_limit ?? 0,
      remaining: budget.remaining ?? 0,
      willExceed: budget.enabled && cart.total > budget.remaining,
    },
  };
}

module.exports = { run };

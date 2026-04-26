"use strict";

// Intent-specific execution logic.
// Each handler calls tools.js functions, builds an actions array, and returns
// a standardised ExecutionResult.

const { INTENTS } = require("./intents");
const tools = require("./tools");

// ── ExecutionResult shape ─────────────────────────────────────────────────────
// {
//   actions       : Array<{type,…}>  — what happened (for toast / logging)
//   cart          : { items, total, itemCount }
//   budget        : { enabled, remaining, monthly_limit }
//   needsDisambig : boolean
//   options       : Array<{id,name,price}>  (for disambiguation)
//   logWorthy     : boolean  — should memory.logTask be called?
// }

async function buildResult(ctx, actions, logWorthy = true) {
  const [cart, budget] = await Promise.all([
    tools.getCart(ctx, { userId: ctx.userId }),
    tools.getBudget(ctx, { userId: ctx.userId }),
  ]);
  return { actions, cart, budget, needsDisambig: false, options: [], logWorthy };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function exactMatch(rows, query) {
  const q = query.toLowerCase();
  return rows.find((r) => r.name.toLowerCase() === q) || null;
}

async function resolveItem(ctx, { name, quantity = 1 }) {
  const rows = await tools.searchProducts(ctx, { query: name });
  if (!rows.length) return { type: "not_found", item: name };

  const exact = exactMatch(rows, name);
  if (exact) return { type: "found", product: exact, quantity };

  if (rows.length === 1) return { type: "found", product: rows[0], quantity };

  return {
    type: "ambiguous",
    options: rows.slice(0, 4).map((r) => ({ id: r.id, name: r.name, price: r.price })),
    quantity,
    item: name,
  };
}

// ── Intent handlers ───────────────────────────────────────────────────────────

async function handleGreeting(ctx) {
  const actions = [{ type: "greeting" }];
  return buildResult(ctx, actions, false);
}

async function handleAddToCart(ctx, entities) {
  const items = Array.isArray(entities.items) ? entities.items : [];
  const actions = [];
  let disambig = null;

  for (const item of items) {
    if (!item?.name) continue;
    const resolved = await resolveItem(ctx, item);

    if (resolved.type === "not_found") {
      actions.push({ type: "NOT_FOUND", item: item.name });
    } else if (resolved.type === "ambiguous") {
      disambig = resolved;
      actions.push({ type: "AMBIGUOUS", item: item.name, options: resolved.options });
      break;
    } else {
      const { product, quantity } = resolved;
      await tools.addToCart(ctx, { userId: ctx.userId, productId: product.id, quantity });
      actions.push({ type: "ADDED", productId: product.id, name: product.name, quantity, price: product.price });
    }
  }

  const result = await buildResult(ctx, actions);
  if (disambig) {
    result.needsDisambig = true;
    result.options = disambig.options;
  }
  return result;
}

async function handleRemoveFromCart(ctx, entities) {
  const actions = [];
  const cart = await tools.getCart(ctx, { userId: ctx.userId });
  const targets = Array.isArray(entities.items) ? entities.items : [];

  for (const item of targets) {
    if (!item?.name) continue;
    const match = cart.items.find((ci) =>
      ci.name.toLowerCase().includes(item.name.toLowerCase())
    );
    if (!match) {
      actions.push({ type: "NOT_IN_CART", item: item.name });
    } else {
      await tools.removeFromCart(ctx, { userId: ctx.userId, productId: match.product_id });
      actions.push({ type: "REMOVED", name: match.name });
    }
  }

  return buildResult(ctx, actions);
}

async function handleUpdateQuantity(ctx, entities) {
  const actions = [];
  const cart = await tools.getCart(ctx, { userId: ctx.userId });

  for (const item of (entities.items || [])) {
    if (!item?.name || item.quantity == null) continue;
    const match = cart.items.find((ci) =>
      ci.name.toLowerCase().includes(item.name.toLowerCase())
    );
    if (!match) {
      actions.push({ type: "NOT_IN_CART", item: item.name });
    } else {
      await tools.updateCart(ctx, { userId: ctx.userId, productId: match.product_id, quantity: item.quantity });
      actions.push({ type: "QUANTITY_UPDATED", name: match.name, quantity: item.quantity });
    }
  }

  return buildResult(ctx, actions);
}

async function handleViewCart(ctx) {
  const actions = [{ type: "VIEW_CART" }];
  return buildResult(ctx, actions, false);
}

async function handleCheckBudget(ctx) {
  const actions = [{ type: "CHECK_BUDGET" }];
  return buildResult(ctx, actions, false);
}

async function handleSearchProduct(ctx, entities) {
  const actions = [];
  const queries = (entities.items || []).map((i) => i.name).filter(Boolean);
  if (!queries.length && entities.category) queries.push(entities.category);
  if (!queries.length && entities.reference) queries.push(entities.reference);

  for (const q of queries.slice(0, 3)) {
    const rows = await tools.searchProducts(ctx, { query: q });
    actions.push({ type: "SEARCH_RESULTS", query: q, results: rows.slice(0, 5) });
  }

  return buildResult(ctx, actions, false);
}

async function handleRecommend(ctx, entities) {
  const actions = [];
  const category = entities.category || entities.reference || "grocery";
  const rows = await tools.searchProducts(ctx, { query: category, limit: 6 });
  actions.push({ type: "RECOMMEND_RESULTS", results: rows });
  return buildResult(ctx, actions, false);
}

async function handleCheckout(ctx) {
  const actions = [];
  try {
    const result = await tools.checkout(ctx, { userId: ctx.userId });
    actions.push({ type: "CHECKOUT_COMPLETE", ...result });
  } catch (err) {
    if (err.code === "EMPTY_CART") {
      actions.push({ type: "CHECKOUT_FAILED", reason: "EMPTY_CART" });
    } else if (err.code === "NO_ADDRESS") {
      actions.push({ type: "CHECKOUT_NEEDS_ADDRESS" });
    } else {
      throw err;
    }
  }
  return buildResult(ctx, actions);
}

async function handleReorder(ctx) {
  const actions = [];
  const orders = await tools.getOrders(ctx, { userId: ctx.userId, limit: 1 });
  if (!orders.length || !orders[0].items.length) {
    actions.push({ type: "REORDER_FAILED", reason: "NO_PREVIOUS_ORDERS" });
    return buildResult(ctx, actions, false);
  }

  const lastItems = orders[0].items.slice(0, 10);
  for (const item of lastItems) {
    if (item.product_id) {
      await tools.addToCart(ctx, { userId: ctx.userId, productId: item.product_id, quantity: item.quantity });
      actions.push({ type: "ADDED", productId: item.product_id, name: item.name, quantity: item.quantity, price: item.price });
    }
  }
  return buildResult(ctx, actions);
}

async function handleUnknown(ctx) {
  return buildResult(ctx, [{ type: "UNKNOWN" }], false);
}

// ── Disambiguation resolution ─────────────────────────────────────────────────
// Called when pending disambiguation exists and user sends a choice number.
async function handleDisambigResolution(ctx, pending, choiceIndex) {
  const selected = pending.options[choiceIndex];
  if (!selected) return buildResult(ctx, [{ type: "INVALID_CHOICE" }], false);

  const qty = pending.quantity || 1;
  await tools.addToCart(ctx, { userId: ctx.userId, productId: selected.id, quantity: qty });
  const actions = [{ type: "ADDED", productId: selected.id, name: selected.name, quantity: qty, price: selected.price }];
  return buildResult(ctx, actions);
}

// ── Main execute entry point ──────────────────────────────────────────────────

async function execute(intent, entities, ctx, pending) {
  switch (intent) {
    case INTENTS.GREETING:         return handleGreeting(ctx);
    case INTENTS.ADD_TO_CART:      return handleAddToCart(ctx, entities);
    case INTENTS.REMOVE_FROM_CART: return handleRemoveFromCart(ctx, entities);
    case INTENTS.UPDATE_QUANTITY:  return handleUpdateQuantity(ctx, entities);
    case INTENTS.VIEW_CART:        return handleViewCart(ctx);
    case INTENTS.CHECK_BUDGET:     return handleCheckBudget(ctx);
    case INTENTS.SEARCH_PRODUCT:   return handleSearchProduct(ctx, entities);
    case INTENTS.RECOMMEND:        return handleRecommend(ctx, entities);
    case INTENTS.CHECKOUT:         return handleCheckout(ctx);
    case INTENTS.REORDER:          return handleReorder(ctx);
    default:                       return handleUnknown(ctx);
  }
}

module.exports = { execute, handleDisambigResolution };

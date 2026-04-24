import type { CartItem } from "@/store/cart-store";
import { products } from "@/data/products";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReplaceSuggestion {
  type: "replace";
  itemId: string;
  fromName: string;
  fromPrice: number;
  toId: string;
  toName: string;
  toImage: string;
  toPrice: number;
  /** Total savings across all quantity units */
  savings: number;
  quantity: number;
}

export interface RemoveSuggestion {
  type: "remove";
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  /** Full line total (price × quantity) saved on removal */
  savings: number;
  reason: string;
}

export type CartSuggestion = ReplaceSuggestion | RemoveSuggestion;

export interface OptimizationResult {
  suggestions: CartSuggestion[];
  replaceSuggestions: ReplaceSuggestion[];
  removeSuggestions: RemoveSuggestion[];
  totalSavings: number;
  optimizedTotal: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum per-unit savings to bother suggesting a swap */
const MIN_REPLACE_SAVINGS = 10;

/** Non-essential categories — eligible for remove suggestions */
const NON_ESSENTIAL = new Set(["Beverages", "Snacks"]);

/** Line item is an "outlier" if it exceeds this fraction of the cart total */
const OUTLIER_THRESHOLD = 0.30;

// ── Pure optimisation function ────────────────────────────────────────────────

/**
 * Analyses `items` against `budget` and returns actionable optimisation
 * suggestions. This is a pure function — no side effects, no store access.
 *
 * Suggestion sources:
 *  REPLACE (A) — explicit cheaperAlternativeId link with savings > MIN_REPLACE_SAVINGS
 *  REPLACE (B) — cheapest same-category product when no explicit link exists
 *  REMOVE      — non-essential items when over budget, OR any item whose line
 *                total alone exceeds OUTLIER_THRESHOLD of the cart total
 */
export function optimizeCart(
  items: CartItem[],
  budget: number
): OptimizationResult {
  const empty: OptimizationResult = {
    suggestions: [],
    replaceSuggestions: [],
    removeSuggestions: [],
    totalSavings: 0,
    optimizedTotal: 0,
  };

  if (items.length === 0) return empty;

  const catalog = Object.fromEntries(products.map((p) => [p.id, p]));
  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const replaceSuggestions: ReplaceSuggestion[] = [];
  const removeSuggestions: RemoveSuggestion[] = [];
  const alreadyReplaced = new Set<string>();

  // ── Source A: explicit cheaperAlternativeId ───────────────────────────────
  for (const item of items) {
    const product = catalog[item.id];
    if (!product?.cheaperAlternativeId) continue;

    const alt = catalog[product.cheaperAlternativeId];
    if (!alt) continue;

    const perUnit = product.price - alt.price;
    if (perUnit < MIN_REPLACE_SAVINGS) continue;

    alreadyReplaced.add(item.id);
    replaceSuggestions.push({
      type: "replace",
      itemId: item.id,
      fromName: item.name,
      fromPrice: item.price,
      toId: alt.id,
      toName: alt.name,
      toImage: alt.image,
      toPrice: alt.price,
      savings: perUnit * item.quantity,
      quantity: item.quantity,
    });
  }

  // ── Source B: cheapest same-category alternative (when no explicit link) ──
  for (const item of items) {
    if (alreadyReplaced.has(item.id)) continue;

    const cheapest = products
      .filter(
        (p) =>
          p.category === item.category &&
          p.id !== item.id &&
          item.price - p.price >= MIN_REPLACE_SAVINGS
      )
      .sort((a, b) => a.price - b.price)[0];

    if (!cheapest) continue;

    alreadyReplaced.add(item.id);
    const perUnit = item.price - cheapest.price;
    replaceSuggestions.push({
      type: "replace",
      itemId: item.id,
      fromName: item.name,
      fromPrice: item.price,
      toId: cheapest.id,
      toName: cheapest.name,
      toImage: cheapest.image,
      toPrice: cheapest.price,
      savings: perUnit * item.quantity,
      quantity: item.quantity,
    });
  }

  // ── REMOVE suggestions ────────────────────────────────────────────────────
  // Only consider items not already covered by a replace suggestion
  // (avoid double-counting their savings).
  const removePool = items.filter((i) => !alreadyReplaced.has(i.id));
  const isOverBudget = budget > 0 && cartTotal > budget;

  if (isOverBudget) {
    // Sort: non-essential first, then by line total descending
    const sorted = [...removePool].sort((a, b) => {
      const aNE = NON_ESSENTIAL.has(a.category) ? 0 : 1;
      const bNE = NON_ESSENTIAL.has(b.category) ? 0 : 1;
      if (aNE !== bNE) return aNE - bNE;
      return b.price * b.quantity - a.price * a.quantity;
    });

    let deficitCovered = 0;
    const deficit = cartTotal - budget;

    for (const item of sorted) {
      if (deficitCovered >= deficit) break;

      const lineTotal = item.price * item.quantity;
      const isNE = NON_ESSENTIAL.has(item.category);
      const isOutlier = lineTotal / cartTotal > OUTLIER_THRESHOLD;

      if (!isNE && !isOutlier) continue;

      removeSuggestions.push({
        type: "remove",
        itemId: item.id,
        itemName: item.name,
        itemPrice: item.price,
        quantity: item.quantity,
        savings: lineTotal,
        reason: isNE
          ? `Non-essential ${item.category.toLowerCase()} item`
          : `Takes up ${Math.round((lineTotal / cartTotal) * 100)}% of cart total`,
      });
      deficitCovered += lineTotal;
    }
  } else {
    // Without a budget constraint, still flag outlier items
    for (const item of removePool) {
      const lineTotal = item.price * item.quantity;
      const pct = lineTotal / cartTotal;
      const isNE = NON_ESSENTIAL.has(item.category);

      if ((isNE && pct > 0.15) || pct > OUTLIER_THRESHOLD) {
        removeSuggestions.push({
          type: "remove",
          itemId: item.id,
          itemName: item.name,
          itemPrice: item.price,
          quantity: item.quantity,
          savings: lineTotal,
          reason: isNE
            ? `Optional ${item.category.toLowerCase()} — skipping saves ₹${Math.round(lineTotal)}`
            : `This item alone is ${Math.round(pct * 100)}% of your cart`,
        });
      }
    }
  }

  const allSuggestions: CartSuggestion[] = [...replaceSuggestions, ...removeSuggestions];
  const totalSavings = allSuggestions.reduce((s, sg) => s + sg.savings, 0);
  const optimizedTotal = Math.max(0, cartTotal - totalSavings);

  return {
    suggestions: allSuggestions,
    replaceSuggestions,
    removeSuggestions,
    totalSavings,
    optimizedTotal,
  };
}

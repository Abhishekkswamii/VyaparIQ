import { useState, useEffect, useMemo } from "react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";

export interface Prediction {
  willExceed: boolean;
  projectedTotal: number;
  remainingItems: number;
  confidence: number;
  message: string;
}

/**
 * Computes a local predictive budget warning.
 * Also attempts to call /ai/predict for richer predictions.
 * Falls back to local computation if AI service is unavailable.
 */
export function usePrediction() {
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const budget = useBudgetStore((s) => s.budget);
  const [aiPrediction, setAiPrediction] = useState<Prediction | null>(null);

  const spent = totalPrice();
  const itemCount = items.length;
  const avgPrice = itemCount > 0 ? spent / itemCount : 0;

  // Local prediction (instant, no API)
  const local = useMemo<Prediction>(() => {
    if (budget <= 0) {
      return {
        willExceed: false,
        projectedTotal: spent,
        remainingItems: 0,
        confidence: 0,
        message: "No budget set.",
      };
    }

    const remaining = budget - spent;
    const remainingItems =
      avgPrice > 0 ? Math.max(0, Math.floor(remaining / avgPrice)) : 0;
    const pctUsed = spent / budget;

    // Project: user adds ~3 more items at avg rate
    const projected = itemCount > 0 ? spent + avgPrice * 3 : spent;
    const willExceed = projected > budget || spent >= budget;

    let message: string;
    if (spent >= budget) {
      message = `Budget exceeded by ₹${Math.round(spent - budget)}.`;
    } else if (pctUsed > 0.9) {
      message = `Almost there! ~${remainingItems} items left at avg price.`;
    } else if (pctUsed > 0.7) {
      message = `${Math.round(pctUsed * 100)}% used. ~${remainingItems} more items fit.`;
    } else if (willExceed) {
      message = `At this pace you'll exceed budget. ~${remainingItems} items left.`;
    } else {
      message = `On track. ~${remainingItems} more items fit in budget.`;
    }

    return {
      willExceed,
      projectedTotal: Math.round(projected),
      remainingItems,
      confidence: pctUsed > 0.7 ? 0.85 : 0.5,
      message,
    };
  }, [spent, budget, avgPrice, itemCount]);

  // Attempt AI prediction (debounced)
  useEffect(() => {
    if (budget <= 0 || itemCount === 0) {
      setAiPrediction(null);
      return;
    }

    const ctrl = new AbortController();
    const timeout = setTimeout(() => {
      fetch("/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_spent: spent,
          budget,
          item_count: itemCount,
          average_item_price: avgPrice,
        }),
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          setAiPrediction({
            willExceed: data.will_exceed,
            projectedTotal: data.projected_total,
            remainingItems: data.remaining_items,
            confidence: data.confidence,
            message: data.message,
          });
        })
        .catch(() => {
          // AI unavailable — use local
          setAiPrediction(null);
        });
    }, 600);

    return () => {
      clearTimeout(timeout);
      ctrl.abort();
    };
  }, [spent, budget, itemCount, avgPrice]);

  return aiPrediction ?? local;
}

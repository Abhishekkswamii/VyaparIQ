import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { useToastStore } from "@/store/toast-store";
import { formatINR } from "@/lib/format";

/**
 * Global budget-alert hook.
 * Fires toasts at 70 %, 90 %, and 100 % thresholds — once per session each.
 * Returns derived budget status so callers can use it for UI hints.
 */
export function useAlerts() {
  const spent = useCartStore((s) => s.totalAmount);
  const budget = useBudgetStore((s) => s.budget);
  const addToast = useToastStore((s) => s.addToast);
  const triggered = useRef(new Set<number>());
  const prevBudget = useRef(budget);

  const remaining = budget - spent;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = budget > 0 && spent > budget;

  // Reset triggered set when the budget value itself changes
  useEffect(() => {
    if (prevBudget.current !== budget) {
      triggered.current.clear();
      prevBudget.current = budget;
    }
  }, [budget]);

  useEffect(() => {
    if (budget <= 0) return;

    if (pct >= 100 && !triggered.current.has(100)) {
      triggered.current.add(100);
      addToast({
        message: `🚨 Budget exceeded by ${formatINR(spent - budget)}`,
        type: "danger",
        duration: 8000,
      });
    }

    if (pct >= 90 && pct < 100 && !triggered.current.has(90)) {
      triggered.current.add(90);
      addToast({
        message: `🔶 Almost out! Only ${formatINR(remaining)} left`,
        type: "warning",
        duration: 5000,
      });
    }

    if (pct >= 70 && pct < 90 && !triggered.current.has(70)) {
      triggered.current.add(70);
      addToast({
        message: `⚠️ 70% of budget used — ${formatINR(remaining)} remaining`,
        type: "warning",
        duration: 5000,
      });
    }
  }, [pct, budget, spent, remaining, addToast]);

  return { pct, isOverBudget, remaining, spent };
}

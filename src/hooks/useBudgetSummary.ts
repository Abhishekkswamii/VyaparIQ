import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  usedPercentage: number;
  hasBudget: boolean;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

/**
 * Single source of truth for all budget-related computed values.
 *
 * Key: reads `totalAmount` (a reactive stored number) NOT `totalPrice()`
 * (which is a stable function reference that never triggers re-renders).
 *
 * Both subscriptions (`budget` and `totalAmount`) are Zustand-tracked scalars,
 * so any component using this hook re-renders correctly whenever the cart or
 * budget changes.
 */
export function useBudgetSummary(): BudgetSummary {
  const totalBudget = useBudgetStore((s) => s.budget);
  const totalSpent = useCartStore((s) => s.totalAmount); // reactive stored value ✓

  const hasBudget = totalBudget > 0;
  const remainingBudget = hasBudget ? totalBudget - totalSpent : 0;
  const usedPercentage = hasBudget
    ? Math.min((totalSpent / totalBudget) * 100, 100)
    : 0;
  const isOverBudget = hasBudget && totalSpent > totalBudget;
  const isNearLimit = !isOverBudget && usedPercentage > 80;

  return {
    totalBudget,
    totalSpent,
    remainingBudget,
    usedPercentage,
    hasBudget,
    isOverBudget,
    isNearLimit,
  };
}

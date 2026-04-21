import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCartStore } from "./cart-store";

interface BudgetState {
  budget: number;       // persisted total budget
  totalBudget: number;  // alias kept in sync

  setBudget: (amount: number) => void;
  resetBudget: () => void;
  clearBudget: () => void;

  // Derived helpers (read from cartStore at call-time)
  amountSpent: () => number;
  remaining: () => number;
  percentUsed: () => number;
}

function syncToAPI(budget: number) {
  fetch("/api/budget", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthly_limit: budget }),
  }).catch(() => {
    // Best-effort — local state is source of truth
  });
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budget: 0,
      totalBudget: 0,

      setBudget: (amount) => {
        const v = Math.max(0, amount);
        set({ budget: v, totalBudget: v });
        syncToAPI(v);
      },

      resetBudget: () => {
        set({ budget: 0, totalBudget: 0 });
        syncToAPI(0);
      },

      clearBudget: () => {
        set({ budget: 0, totalBudget: 0 });
        syncToAPI(0);
      },

      amountSpent: () => useCartStore.getState().totalPrice(),

      remaining: () => {
        const b = get().budget;
        const spent = useCartStore.getState().totalPrice();
        return b - spent;
      },

      percentUsed: () => {
        const b = get().budget;
        if (b <= 0) return 0;
        return (useCartStore.getState().totalPrice() / b) * 100;
      },
    }),
    {
      name: "smartcart-budget",
      partialize: (state) => ({
        budget: state.budget,
        totalBudget: state.totalBudget,
      }),
    }
  )
);

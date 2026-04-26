import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";

/**
 * Stores only the user-set budget value (persisted).
 *
 * Derived values (spent, remaining, usedPercentage) live in useBudgetSummary
 * which combines this store with the reactive `totalAmount` from cartStore.
 */
interface BudgetState {
  budget: number;
  setBudget: (amount: number) => void;
  resetBudget: () => void;
  clearBudget: () => void;
}

function syncToAPI(budget: number) {
  const token = useAuthStore.getState().token;
  if (!token) return;
  fetch("/api/budget", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ monthly_limit: budget }),
  }).catch(() => {
    // Best-effort — local state is source of truth
  });
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      budget: 0,

      setBudget: (amount) => {
        const v = Math.max(0, amount);
        set({ budget: v });
        syncToAPI(v);
      },

      resetBudget: () => {
        set({ budget: 0 });
        syncToAPI(0);
      },

      clearBudget: () => {
        set({ budget: 0 });
        syncToAPI(0);
      },
    }),
    {
      name: "vyapariq-budget",
      partialize: (state) => ({ budget: state.budget }),
    }
  )
);

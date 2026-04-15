import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BudgetState {
  budget: number;
  setBudget: (amount: number) => void;
  clearBudget: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      budget: 0,
      setBudget: (amount) => set({ budget: Math.max(0, amount) }),
      clearBudget: () => set({ budget: 0 }),
    }),
    { name: "smartcart-budget" }
  )
);

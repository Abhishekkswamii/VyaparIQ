import { create } from "zustand";
import { useCartStore } from "./cart-store";
import { useBudgetStore } from "./budget-store";

export interface SessionSummary {
  id?: number;
  totalSpent: number;
  itemCount: number;
  budget: number;
  savings: number;
  items: { id: string; name: string; price: number; quantity: number; category: string }[];
}

interface SessionState {
  activeSessionId: string | null;
  lastSummary: SessionSummary | null;
  showSummary: boolean;
  startSession: () => Promise<void>;
  endSession: () => Promise<SessionSummary>;
  closeSummary: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: null,
  lastSummary: null,
  showSummary: false,

  startSession: async () => {
    const budget = useBudgetStore.getState().budget;
    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetAmount: budget }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ activeSessionId: String(data.session.id) });
      }
    } catch {
      // Offline — session will be created on checkout
    }
  },

  endSession: async () => {
    const cart = useCartStore.getState();
    const budget = useBudgetStore.getState().budget;
    const items = cart.items.map((i) => ({
      id: i.id,
      productId: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      category: i.category,
      amount: i.price * i.quantity,
    }));
    const totalSpent = items.reduce((s, i) => s + i.amount, 0);

    const summary: SessionSummary = {
      totalSpent,
      itemCount: items.length,
      budget,
      savings: 0,
      items,
    };

    try {
      const res = await fetch("/api/sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          totalSpent,
          savingsAchieved: 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        summary.id = data.session.id;
      }
    } catch {
      // Offline — summary still shown locally
    }

    // Clear cart
    cart.clearCart();

    set({
      activeSessionId: null,
      lastSummary: summary,
      showSummary: true,
    });

    return summary;
  },

  closeSummary: () => set({ showSummary: false }),
}));

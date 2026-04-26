import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/data/products";
import { useFamilyStore } from "./family-store";

export interface CartItem extends Product {
  quantity: number;
  addedBy?: string;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  lastUpdated: number;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
  syncToBackend: () => Promise<void>;

  // Backward-compatible computed helpers
  totalItems: () => number;
  totalPrice: () => number;
}

function derive(items: CartItem[]) {
  return {
    totalAmount: items.reduce((s, i) => s + i.price * i.quantity, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    lastUpdated: Date.now(),
  };
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSync(fn: () => Promise<void>) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => fn(), 500);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalAmount: 0,
      itemCount: 0,
      lastUpdated: Date.now(),

      addItem: (product) => {
        const addedBy = useFamilyStore.getState().enabled
          ? useFamilyStore.getState().activeMemberId
          : undefined;
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);
          const items = existing
            ? state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            : [...state.items, { ...product, quantity: 1, addedBy }];
          return { items, ...derive(items) };
        });
        
        // Auto-open drawer on add
        import("./cart-ui-store").then(m => m.useCartUIStore.getState().openDrawer());
        
        scheduleSync(() => get().syncToBackend());
      },

      removeItem: (productId) => {
        set((state) => {
          const items = state.items.filter((item) => item.id !== productId);
          return { items, ...derive(items) };
        });
        scheduleSync(() => get().syncToBackend());
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const items = state.items.filter((item) => item.id !== productId);
            return { items, ...derive(items) };
          }
          const items = state.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          );
          return { items, ...derive(items) };
        });
        scheduleSync(() => get().syncToBackend());
      },

      incrementQuantity: (productId) => {
        set((state) => {
          const items = state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          return { items, ...derive(items) };
        });
        scheduleSync(() => get().syncToBackend());
      },

      decrementQuantity: (productId) => {
        set((state) => {
          const item = state.items.find((i) => i.id === productId);
          if (item && item.quantity <= 1) {
            const items = state.items.filter((i) => i.id !== productId);
            return { items, ...derive(items) };
          }
          const items = state.items.map((i) =>
            i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
          );
          return { items, ...derive(items) };
        });
        scheduleSync(() => get().syncToBackend());
      },

      clearCart: () => {
        set({ items: [], totalAmount: 0, itemCount: 0, lastUpdated: Date.now() });
        scheduleSync(() => get().syncToBackend());
      },

      replaceCart: (items) => {
        set({ items, ...derive(items) });
      },

      syncToBackend: async () => {
        try {
          await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: get().items.map((i) => ({
                product_id: i.id,
                quantity: i.quantity,
              })),
            }),
          });
        } catch {
          // Best-effort sync — local state is source of truth
        }
      },

      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    {
      name: "vyapariq-cart",
      partialize: (state) => ({
        items: state.items,
        totalAmount: state.totalAmount,
        itemCount: state.itemCount,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

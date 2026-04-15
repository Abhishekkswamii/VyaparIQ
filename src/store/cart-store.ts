import { create } from "zustand";
import type { Product } from "@/data/products";

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  totalItems: () => number;
  totalPrice: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  incrementQuantity: (productId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    }));
  },

  decrementQuantity: (productId) => {
    set((state) => {
      const item = state.items.find((i) => i.id === productId);
      if (item && item.quantity <= 1) {
        return { items: state.items.filter((i) => i.id !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    });
  },

  totalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  totalPrice: () => {
    return get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },

  clearCart: () => set({ items: [] }),
}));

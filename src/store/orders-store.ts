import { create } from "zustand";
import { useAuthStore } from "./auth-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number | null;
  name: string;
  category: string | null;
  /** Decimal comes as string from PostgreSQL */
  price: string;
  quantity: number;
  line_total: string;
}

export interface DeliveryAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

/** Summary shape returned by GET /api/orders (includes item_count) */
export interface OrderSummary {
  id: number;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  total_amount: string;
  delivery_address: DeliveryAddress;
  payment_method: string;
  created_at: string;
  updated_at: string;
  item_count: number;
  invoice_id: string | null;
  invoice_path: string | null;
  invoice_status: string | null;
}

interface OrdersState {
  orders: OrderSummary[];
  loading: boolean;
  error: string | null;
  /** Per-order item detail, keyed by order id — avoids re-fetching */
  detailCache: Record<number, OrderItem[]>;
  detailLoading: Record<number, boolean>;

  fetchOrders: () => Promise<void>;
  fetchOrderDetail: (id: number) => Promise<void>;
  clearOrders: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  detailCache: {},
  detailLoading: {},

  // GET /api/orders
  fetchOrders: async () => {
    const token = useAuthStore.getState().token;
    if (!token) { set({ loading: false, error: "Not authenticated" }); return; }
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      set({ orders: data.orders ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  // GET /api/orders/:id — lazy, cached
  fetchOrderDetail: async (id: number) => {
    if (get().detailCache[id] !== undefined) return; // already cached
    const token = useAuthStore.getState().token;
    if (!token) return;
    set((s) => ({ detailLoading: { ...s.detailLoading, [id]: true } }));
    try {
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        detailCache: { ...s.detailCache, [id]: data.order.items ?? [] },
        detailLoading: { ...s.detailLoading, [id]: false },
      }));
    } catch {
      set((s) => ({ detailLoading: { ...s.detailLoading, [id]: false } }));
    }
  },

  clearOrders: () =>
    set({ orders: [], detailCache: {}, detailLoading: {}, error: null }),
}));

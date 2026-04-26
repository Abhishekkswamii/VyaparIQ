import { create } from "zustand";
import { useAuthStore } from "./auth-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminProduct {
  id: number;
  name: string;
  price: string;
  category: string;
  stock: number;
  image_url: string | null;
  barcode: string | null;
  created_at: string;
}

export interface AdminStats {
  totalProducts:   number;
  totalUsers:      number;
  totalOrders:     number;
  totalRevenue:    number;
  avgOrderValue:   number;
  pendingOrders:   number;
  deliveredOrders: number;
  cancelledOrders: number;
  todayOrders:     number;
  todayRevenue:    number;
  lowStockCount:   number;
}

export interface AdminOrder {
  id:               number;
  status:           string;
  subtotal:         string;
  discount:         string;
  total_amount:     string;
  payment_method:   string;
  delivery_address: Record<string, string>;
  created_at:       string;
  item_count:       number;
  invoice_id:       string | null;
  first_name:       string;
  last_name:        string;
  email:            string;
}

export interface AdminInvoice {
  id:             number;
  invoice_id:     string;
  order_id:       number;
  user_id:        number;
  email:          string;
  first_name:     string;
  last_name:      string;
  invoice_status: string;
  file_size:      number | null;
  created_at:     string;
}

interface AdminState {
  products:     AdminProduct[];
  totalProducts: number;
  currentPage:  number;
  totalPages:   number;

  stats:        AdminStats | null;
  statsLoading: boolean;

  orders:        AdminOrder[];
  ordersLoading: boolean;
  ordersTotal:   number;

  invoices:        AdminInvoice[];
  invoicesLoading: boolean;

  loading: boolean;
  error:   string | null;

  fetchProducts:     (page?: number, search?: string) => Promise<void>;
  createProduct:     (data: FormData) => Promise<void>;
  updateProduct:     (id: number, data: FormData) => Promise<void>;
  deleteProduct:     (id: number) => Promise<void>;
  fetchStats:        () => Promise<void>;
  fetchAdminOrders:  (limit?: number, offset?: number) => Promise<void>;
  updateOrderStatus: (id: number, status: string) => Promise<void>;
  fetchAdminInvoices:() => Promise<void>;
  reset:             () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return useAuthStore.getState().token;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAdminStore = create<AdminState>()((set, get) => ({
  products:     [],
  totalProducts: 0,
  currentPage:  1,
  totalPages:   1,

  stats:        null,
  statsLoading: false,

  orders:        [],
  ordersLoading: false,
  ordersTotal:   0,

  invoices:        [],
  invoicesLoading: false,

  loading: false,
  error:   null,

  reset: () =>
    set({
      products: [], totalProducts: 0, currentPage: 1, totalPages: 1,
      stats: null, statsLoading: false,
      orders: [], ordersLoading: false, ordersTotal: 0,
      invoices: [], invoicesLoading: false,
      loading: false, error: null,
    }),

  // ── Admin orders ──────────────────────────────────────────────────────────

  fetchAdminOrders: async (limit = 50, offset = 0) => {
    set({ ordersLoading: true });
    try {
      const res = await fetch(`/api/admin/orders?limit=${limit}&offset=${offset}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ orders: data.orders ?? [], ordersTotal: data.total ?? 0, ordersLoading: false });
    } catch { set({ ordersLoading: false }); }
  },

  updateOrderStatus: async (id, status) => {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    set((s) => ({
      orders: s.orders.map((o) => o.id === id ? { ...o, status } : o),
    }));
    get().fetchStats();
  },

  // ── Admin invoices ────────────────────────────────────────────────────────

  fetchAdminInvoices: async () => {
    set({ invoicesLoading: true });
    try {
      const res = await fetch("/api/admin/invoices?limit=100", { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ invoices: data.invoices ?? [], invoicesLoading: false });
    } catch { set({ invoicesLoading: false }); }
  },

  // ── Stats ─────────────────────────────────────────────────────────────────

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const res = await fetch("/api/admin/stats", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      set({ stats: data, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  // ── Products ──────────────────────────────────────────────────────────────

  fetchProducts: async (page = 1, search = "") => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      set({
        products: data.products,
        totalProducts: data.total,
        currentPage: data.page,
        totalPages: data.totalPages,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createProduct: async (formData) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.msg ?? data.error ?? "Failed to create product");
    await get().fetchProducts(get().currentPage);
  },

  updateProduct: async (id, formData) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.msg ?? data.error ?? "Failed to update product");
    await get().fetchProducts(get().currentPage);
  },

  deleteProduct: async (id) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete product");
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },
}));

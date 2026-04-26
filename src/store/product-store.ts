import { create } from "zustand";
import type { Product } from "@/data/products";

interface ApiProduct {
  id: number;
  name: string;
  price: string | number;
  mrp: string | number | null;
  category: string;
  barcode: string | null;
  image_url: string | null;
  rating: string | number | null;
  review_count: number | null;
  badge: string | null;
  cheaper_alternative_id: number | null;
  cheaper_alternative_name: string | null;
  cheaper_alternative_price: string | number | null;
}

function toProduct(r: ApiProduct): Product {
  const imageUrl = typeof r.image_url === "string" && r.image_url.trim().length > 0
    ? r.image_url.trim()
    : null;

  return {
    id: String(r.id),
    name: r.name,
    price: Number(r.price),
    mrp: r.mrp != null ? Number(r.mrp) : undefined,
    category: r.category,
    barcode: r.barcode ?? undefined,
    image:
      imageUrl ??
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop&auto=format&q=75",
    rating: r.rating != null ? Number(r.rating) : undefined,
    reviews: r.review_count ?? undefined,
    badge: r.badge ?? undefined,
    cheaperAlternativeId:
      r.cheaper_alternative_id != null ? String(r.cheaper_alternative_id) : undefined,
  };
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetch: () => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetch: async () => {
    const CACHE_TTL = 60_000; // 1 minute client-side cache
    const { lastFetched, loading } = get();
    if (loading) return;
    if (lastFetched && Date.now() - lastFetched < CACHE_TTL) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const products = (data.products as ApiProduct[]).map(toProduct);
      set({ products, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ loading: false, error: String(err) });
    }
  },
}));

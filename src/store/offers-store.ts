import { create } from "zustand";

export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  type: "percent" | "flat" | "auto";
  value: number;
  minCartValue?: number;
  category?: string;        // auto-discount: applies to this category
  minCategoryQty?: number;  // auto-discount: min items in category
  expiresAt?: string;
}

const STORE_OFFERS: Offer[] = [
  {
    id: "o1",
    code: "FRESH10",
    title: "10% off Fruits & Veggies",
    description: "Get 10% off on all Fruits & Vegetables when you buy 3+",
    type: "auto",
    value: 10,
    category: "Fruits",
    minCategoryQty: 3,
  },
  {
    id: "o2",
    code: "DAIRY15",
    title: "15% off Dairy",
    description: "15% off on Dairy items when you buy 2 or more",
    type: "auto",
    value: 15,
    category: "Dairy",
    minCategoryQty: 2,
  },
  {
    id: "o3",
    code: "SAVE50",
    title: "₹50 off on ₹500+",
    description: "Flat ₹50 off on orders above ₹500",
    type: "flat",
    value: 50,
    minCartValue: 500,
  },
  {
    id: "o4",
    code: "MEGA20",
    title: "20% off on ₹1000+",
    description: "20% off on orders above ₹1000 (max ₹200)",
    type: "percent",
    value: 20,
    minCartValue: 1000,
  },
];

interface OffersState {
  offers: Offer[];
  appliedCode: string | null;
  applyCode: (code: string) => boolean;
  removeCode: () => void;
  getAppliedOffer: () => Offer | null;
}

export const useOffersStore = create<OffersState>((set, get) => ({
  offers: STORE_OFFERS,
  appliedCode: null,

  applyCode: (code: string) => {
    const offer = STORE_OFFERS.find(
      (o) => o.code.toUpperCase() === code.toUpperCase()
    );
    if (!offer) return false;
    set({ appliedCode: offer.code });
    return true;
  },

  removeCode: () => set({ appliedCode: null }),

  getAppliedOffer: () => {
    const code = get().appliedCode;
    if (!code) return null;
    return STORE_OFFERS.find((o) => o.code === code) ?? null;
  },
}));

/**
 * Calculate total discount based on cart items + applied coupon + auto offers.
 */
export function calculateDiscount(
  items: { price: number; quantity: number; category: string }[],
  appliedOffer: Offer | null
): { total: number; breakdown: { label: string; amount: number }[] } {
  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const breakdown: { label: string; amount: number }[] = [];

  // Auto discounts
  const categoryQty: Record<string, number> = {};
  const categoryTotal: Record<string, number> = {};
  items.forEach((i) => {
    categoryQty[i.category] = (categoryQty[i.category] ?? 0) + i.quantity;
    categoryTotal[i.category] =
      (categoryTotal[i.category] ?? 0) + i.price * i.quantity;
  });

  for (const offer of STORE_OFFERS) {
    if (offer.type !== "auto" || !offer.category) continue;
    const qty = categoryQty[offer.category] ?? 0;
    if (qty >= (offer.minCategoryQty ?? 1)) {
      const catTotal = categoryTotal[offer.category] ?? 0;
      const amt = Math.round((catTotal * offer.value) / 100);
      if (amt > 0) {
        breakdown.push({ label: offer.title, amount: amt });
      }
    }
  }

  // Applied coupon (manual)
  if (appliedOffer && appliedOffer.type !== "auto") {
    if (
      appliedOffer.minCartValue &&
      cartTotal < appliedOffer.minCartValue
    ) {
      // Not eligible
    } else if (appliedOffer.type === "flat") {
      breakdown.push({ label: appliedOffer.code, amount: appliedOffer.value });
    } else if (appliedOffer.type === "percent") {
      const raw = Math.round((cartTotal * appliedOffer.value) / 100);
      const amt = Math.min(raw, 200); // cap at ₹200
      breakdown.push({ label: appliedOffer.code, amount: amt });
    }
  }

  const total = breakdown.reduce((s, b) => s + b.amount, 0);
  return { total, breakdown };
}

import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Tag,
  Lock,
  ShoppingBag,
  PackageCheck,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { useAuthStore } from "@/store/auth-store";
import { useOffersStore, calculateDiscount } from "@/store/offers-store";
import { useToastStore } from "@/store/toast-store";
import { formatINR } from "@/lib/format";
import FormField from "@/components/checkout/FormField";
import PredictiveBanner from "@/components/cart/PredictiveBanner";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Address {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

type FormErrors = Partial<Record<keyof Address, string>>;

// ── Validation ────────────────────────────────────────────────────────────────

function validate(addr: Address): FormErrors {
  const errors: FormErrors = {};
  if (!addr.name.trim()) {
    errors.name = "Full name is required";
  }
  if (!/^\d{10}$/.test(addr.phone.replace(/\s/g, ""))) {
    errors.phone = "Enter a valid 10-digit mobile number";
  }
  if (addr.address.trim().length < 10) {
    errors.address = "Enter a complete street address (min 10 characters)";
  }
  if (!addr.city.trim()) {
    errors.city = "City is required";
  }
  if (!/^\d{6}$/.test(addr.pincode)) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }
  return errors;
}

// ── Checkout Item Row (read-only) ─────────────────────────────────────────────

interface CheckoutItemRowProps {
  image: string;
  name: string;
  quantity: number;
  lineTotal: number;
}

function CheckoutItemRow({ image, name, quantity, lineTotal }: CheckoutItemRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
        <img src={image} alt={name} className="h-full w-full object-cover" />
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
          {quantity}
        </span>
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
        {name}
      </p>
      <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
        {formatINR(lineTotal)}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const budget = useBudgetStore((s) => s.budget);
  const user = useAuthStore((s) => s.user);
  const getAppliedOffer = useOffersStore((s) => s.getAppliedOffer);
  const addToast = useToastStore((s) => s.addToast);

  const [addr, setAddr] = useState<Address>({
    name: user?.name ?? "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const price = totalPrice();
  const appliedOffer = getAppliedOffer();
  const { total: discountTotal, breakdown } = calculateDiscount(items, appliedOffer);
  const finalPrice = Math.max(0, price - discountTotal);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const hasBudget = budget > 0;
  const isOverBudget = hasBudget && price > budget;
  const remaining = hasBudget ? budget - price : 0;
  const pct = hasBudget ? Math.min((price / budget) * 100, 100) : 0;
  const isNearLimit = !isOverBudget && pct > 80;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const setField = (field: keyof Address) => (value: string) => {
    setAddr((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePlaceOrder = async () => {
    const errs = validate(addr);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstErrorEl = document.querySelector("[data-checkout-form] input[class*='border-red']");
      (firstErrorEl as HTMLElement | null)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            category: i.category,
          })),
          subtotal: price,
          discount: discountTotal,
          total: finalPrice,
          address: addr,
        }),
      });

      if (!res.ok) throw new Error(`Order failed with status ${res.status}`);

      clearCart();
      navigate("/order-success", { state: { total: finalPrice, itemCount } });
    } catch {
      addToast({
        message: "Could not place order. Please try again.",
        type: "danger",
      });
    } finally {
      setPlacing(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">
      {/* Over-budget full-width banner */}
      {isOverBudget && (
        <div className="-mx-5 mb-5 flex items-center justify-center gap-2 bg-red-600 px-4 py-3 text-sm font-bold text-white">
          🚨 Cart exceeds budget by {formatINR(price - budget)}
        </div>
      )}

      {/* Back nav */}
      <div className="mb-6">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
        >
          <ArrowLeft size={15} />
          Back to cart
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* ── LEFT: Address form ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-3"
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20">
                <PackageCheck size={16} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Delivery Details
              </h2>
            </div>

            <div className="space-y-4" data-checkout-form>
              <FormField
                id="name"
                label="Full Name"
                value={addr.name}
                onChange={setField("name")}
                placeholder="Ravi Kumar"
                error={errors.name}
              />

              <FormField
                id="phone"
                label="Mobile Number"
                value={addr.phone}
                onChange={setField("phone")}
                placeholder="98XXXXXXXX"
                error={errors.phone}
                type="tel"
                maxLength={10}
                inputMode="numeric"
              />

              <FormField
                id="address"
                label="Street Address"
                value={addr.address}
                onChange={setField("address")}
                placeholder="House no., Street, Area, Landmark"
                error={errors.address}
                multiline
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  id="city"
                  label="City"
                  value={addr.city}
                  onChange={setField("city")}
                  placeholder="Mumbai"
                  error={errors.city}
                />
                <FormField
                  id="pincode"
                  label="Pincode"
                  value={addr.pincode}
                  onChange={setField("pincode")}
                  placeholder="400001"
                  error={errors.pincode}
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>

            <p className="mt-6 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
              <Lock size={11} />
              Your details are encrypted and never shared
            </p>
          </div>
        </motion.div>

        {/* ── RIGHT: Order summary ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="lg:col-span-2"
        >
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-5 text-base font-bold text-gray-900 dark:text-white">
              Order Summary
            </h3>

            {/* Items list */}
            <div className="mb-5 max-h-48 space-y-3 overflow-y-auto pr-0.5">
              {items.map((item) => (
                <CheckoutItemRow
                  key={item.id}
                  image={item.image}
                  name={item.name}
                  quantity={item.quantity}
                  lineTotal={item.price * item.quantity}
                />
              ))}
            </div>

            <div className="mb-5 h-px bg-gray-100 dark:bg-gray-800" />

            {/* Budget indicator */}
            {hasBudget ? (
              <div className="mb-5 rounded-xl bg-orange-50 p-4 dark:bg-orange-500/10">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Budget
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isOverBudget
                        ? "text-red-500"
                        : pct > 80
                        ? "text-amber-500"
                        : "text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {Math.round(pct)}% used
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-orange-200 dark:bg-gray-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isOverBudget
                        ? "bg-red-500"
                        : pct > 80
                        ? "bg-amber-400"
                        : "bg-orange-500"
                    }`}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{formatINR(price)} spent</span>
                  <span>{formatINR(budget)} budget</span>
                </div>
                {!isOverBudget && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                    <CheckCircle2 size={11} />
                    {formatINR(remaining)} remaining
                  </p>
                )}
              </div>
            ) : (
              <Link
                to="/dashboard"
                className="mb-5 flex items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-700/40 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/15"
              >
                <Wallet size={16} />
                Set a budget to track spending →
              </Link>
            )}

            {/* AI predictive warning */}
            <div className="mb-4">
              <PredictiveBanner />
            </div>

            {/* Budget alerts */}
            <AnimatePresence>
              {isOverBudget && (
                <motion.div
                  key="over"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20"
                >
                  <AlertTriangle size={15} className="shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                    Over budget by {formatINR(price - budget)}. Consider removing items.
                  </p>
                </motion.div>
              )}
              {isNearLimit && (
                <motion.div
                  key="near"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20"
                >
                  <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {Math.round(pct)}% of budget used — approaching limit!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Price breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatINR(price)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Delivery</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">Free</span>
              </div>

              {breakdown.length > 0 &&
                breakdown.map((b) => (
                  <div key={b.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Tag size={12} />
                      {b.label}
                    </span>
                    <span className="font-semibold text-green-600">
                      −{formatINR(b.amount)}
                    </span>
                  </div>
                ))}

              {breakdown.length === 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Tag size={12} />
                    Discount
                  </span>
                  <span className="font-semibold text-gray-400 dark:text-gray-600">—</span>
                </div>
              )}

              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <AnimatedNumber
                  value={finalPrice}
                  className={`text-xl font-extrabold ${
                    isOverBudget ? "text-red-600" : "text-gray-900 dark:text-white"
                  }`}
                />
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-5 w-full rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Placing Order…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingBag size={16} />
                  Place Order · {formatINR(finalPrice)}
                </span>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-gray-600">
              <Lock size={11} />
              Secure &amp; encrypted checkout
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

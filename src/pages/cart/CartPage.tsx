import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Tag,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import CartItem from "@/components/cart/CartItem";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import SmartSuggestions from "@/components/cart/SmartSuggestions";
import { formatINR } from "@/lib/format";
import PredictiveBanner from "@/components/cart/PredictiveBanner";
import FamilyPanel from "@/components/family/FamilyPanel";
import OffersPanel from "@/components/cart/OffersPanel";
import BudgetOptimizer from "@/components/cart/BudgetOptimizer";
import CartOptimizer from "@/components/cart/CartOptimizer";
import { useOffersStore, calculateDiscount } from "@/store/offers-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const budget = useBudgetStore((s) => s.budget);

  const getAppliedOffer = useOffersStore((s) => s.getAppliedOffer);

  const count = totalItems();
  const price = totalPrice();
  const appliedOffer = getAppliedOffer();
  const { total: discountTotal } = calculateDiscount(items, appliedOffer);
  const finalPrice = Math.max(0, price - discountTotal);
  const hasBudget = budget > 0;
  const isOverBudget = hasBudget && price > budget;
  const remaining = hasBudget ? budget - price : 0;
  const pct = hasBudget ? Math.min((price / budget) * 100, 100) : 0;
  const isNearLimit = !isOverBudget && pct > 80;

  if (items.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 px-5 py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-orange-100 text-5xl dark:bg-orange-500/20">
            🛒
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Your cart is empty
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Browse the shop and add items to get started
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            Browse Products
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-32 pt-8">
      {/* Full-width budget exceeded banner */}
      {isOverBudget && (
        <div className="-mx-5 mb-5 flex items-center justify-center gap-2 bg-red-600 px-4 py-3 text-sm font-bold text-white">
          🚨 Budget exceeded by {formatINR(price - budget)}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {count} {count === 1 ? "item" : "items"} in your cart
        </p>
        <button
          onClick={clearCart}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
        >
          <Trash2 size={15} />
          Clear all
        </button>
      </div>

      {/* Budget alerts */}
      <AnimatePresence>
        {isOverBudget && (
          <motion.div
            key="over"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3.5 dark:bg-red-900/20"
          >
            <AlertTriangle size={20} className="shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Over budget by {formatINR(price - budget)}! Consider removing some items.
            </p>
          </motion.div>
        )}
        {isNearLimit && (
          <motion.div
            key="near"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3.5 dark:bg-amber-900/20"
          >
            <AlertTriangle size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              You&apos;ve used {Math.round(pct)}% of your budget. Approaching the limit!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items list */}
        <div className="space-y-3 lg:col-span-2">
          <FamilyPanel />
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </AnimatePresence>

          <Link
            to="/shop"
            className="mt-2 flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
          >
            <ShoppingBag size={15} />
            Continue shopping
          </Link>

          <CartOptimizer />
          <SmartSuggestions />
          <BudgetOptimizer />
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-5 text-base font-bold text-gray-900 dark:text-white">
              Order Summary
            </h3>

            {/* Budget usage panel */}
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
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{formatINR(price)} spent</span>
                  <span>{formatINR(budget)} total</span>
                </div>
                {!isOverBudget && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
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

            {/* Offers */}
            <div className="mb-5">
              <OffersPanel />
            </div>

            {/* Predictive budget warning */}
            <div className="mb-5">
              <PredictiveBanner />
            </div>

            {/* Price breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Subtotal ({count} {count === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatINR(price)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Delivery</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">Free</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Tag size={13} />
                  Discount
                </span>
                <span className={`font-semibold ${discountTotal > 0 ? "text-green-600" : "text-gray-400 dark:text-gray-600"}`}>
                  {discountTotal > 0 ? `-${formatINR(discountTotal)}` : "—"}
                </span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <AnimatedNumber
                  value={finalPrice}
                  className={`text-xl font-extrabold ${isOverBudget ? "text-red-600 shake" : "text-gray-900 dark:text-white"}`}
                />
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-5 block w-full rounded-xl bg-orange-600 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-[0.98]"
            >
              Proceed to Checkout
            </Link>

            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-600">
              🔒 Secure &amp; encrypted checkout
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

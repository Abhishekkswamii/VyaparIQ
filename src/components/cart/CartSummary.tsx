import { Trash2, AlertTriangle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { useCartUIStore } from "@/store/cart-ui-store";

export default function CartSummary() {
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const budget = useBudgetStore((s) => s.budget);
  const close = useCartUIStore((s) => s.closeDrawer);

  const count = totalItems();
  const price = totalPrice();
  const hasBudget = budget > 0;
  const isOverBudget = hasBudget && price > budget;
  const remaining = hasBudget ? budget - price : 0;
  const pct = hasBudget ? Math.min((price / budget) * 100, 100) : 0;

  return (
    <div className="border-t border-gray-100 bg-white px-5 pb-6 pt-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Budget progress */}
      {hasBudget && (
        <div className="mb-4 rounded-xl bg-orange-50 p-3.5 dark:bg-orange-500/10">
          <div className="mb-2 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500 dark:text-gray-500">Budget</span>
            <span className={isOverBudget ? "text-red-500" : "text-gray-700 dark:text-gray-200"}>
              ₹{price.toFixed(2)} / ₹{budget.toFixed(2)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                isOverBudget
                  ? "bg-red-500"
                  : pct > 75
                    ? "bg-amber-400"
                    : "bg-orange-500"
              }`}
            />
          </div>
          <p
            className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
              isOverBudget
                ? "text-red-500"
                : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {isOverBudget ? (
              <>
                <AlertTriangle size={11} />
                Over budget by ₹{(price - budget).toFixed(2)}
              </>
            ) : (
              `₹${remaining.toFixed(2)} remaining`
            )}
          </p>
        </div>
      )}

      {/* Over-budget banner */}
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-3 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400"
        >
          ⚠️ You've exceeded your budget! Consider removing some items.
        </motion.div>
      )}

      {/* No budget nudge */}
      {!hasBudget && (
        <Link
          to="/dashboard"
          onClick={close}
          className="mb-3 flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:underline dark:text-orange-400"
        >
          <Wallet size={12} />
          Set a spending budget →
        </Link>
      )}

      {/* Subtotal row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Subtotal ({count} {count === 1 ? "item" : "items"})
          </p>
          <p className="mt-0.5 text-2xl font-extrabold text-gray-900 dark:text-white">
            ₹{price.toFixed(2)}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400"
        >
          <Trash2 size={15} />
          Clear
        </button>
      </div>

      <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-amber-600 active:scale-[0.98]">
        Checkout
      </button>
    </div>
  );
}

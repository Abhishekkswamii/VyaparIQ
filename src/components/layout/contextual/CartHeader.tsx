import { Link } from "react-router-dom";
import { ShoppingCart, Wallet, ArrowRight, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useOffersStore, calculateDiscount } from "@/store/offers-store";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { formatINR } from "@/lib/format";
import type { ContextHeaderProps } from "./types";

export default function CartHeader(_props: ContextHeaderProps) {
  const items = useCartStore((s) => s.items);
  const count = useCartStore((s) => s.itemCount);
  const price = useCartStore((s) => s.totalAmount);
  const clearCart = useCartStore((s) => s.clearCart);
  const getAppliedOffer = useOffersStore((s) => s.getAppliedOffer);
  const { totalBudget: budget, remainingBudget: remaining, hasBudget, isOverBudget: isOver } = useBudgetSummary();

  const appliedOffer = getAppliedOffer();
  const { total: discountTotal } = calculateDiscount(items, appliedOffer);
  const finalPrice = Math.max(0, price - discountTotal);

  if (count === 0) return null;

  return (
    <div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5">
        {/* Item count */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <ShoppingCart size={14} className="text-orange-500" />
          <span className="font-bold text-gray-900 dark:text-white">{count}</span>
          {count === 1 ? "item" : "items"}
        </div>

        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Subtotal + discount */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Subtotal:{" "}
          <span className="font-bold text-gray-900 dark:text-white">
            {formatINR(finalPrice)}
          </span>
          {discountTotal > 0 && (
            <span className="ml-1.5 font-semibold text-green-600 dark:text-green-400">
              (−{formatINR(discountTotal)} off)
            </span>
          )}
        </div>

        {/* Budget remaining */}
        {hasBudget && (
          <>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5 text-sm">
              <Wallet
                size={13}
                className={isOver ? "text-red-500" : "text-orange-500"}
              />
              <span
                className={`font-semibold ${
                  isOver
                    ? "text-red-500"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {isOver
                  ? `Over ${formatINR(price - budget)}`
                  : `${formatINR(remaining)} left`}
              </span>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={clearCart}
            aria-label="Clear cart"
            className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <Link
            to="/checkout"
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-600/20 transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            Checkout
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

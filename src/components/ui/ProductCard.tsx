import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Minus, Plus, Star, Lightbulb, Zap } from "lucide-react";
import type { Product } from "@/data/products";
import { products } from "@/data/products";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { usePrefsStore } from "@/store/prefs-store";
import { useToastStore } from "@/store/toast-store";
import { formatINR } from "@/lib/format";

const BADGE_COLORS: Record<string, string> = {
  Fresh:      "bg-green-500",
  Bestseller: "bg-orange-500",
  Popular:    "bg-blue-500",
};

const CATEGORY_FALLBACK: Record<string, string> = {
  Fruits:     "bg-yellow-50 dark:bg-yellow-900/10",
  Dairy:      "bg-blue-50 dark:bg-blue-900/10",
  Bakery:     "bg-amber-50 dark:bg-amber-900/10",
  Meat:       "bg-red-50 dark:bg-red-900/10",
  Grains:     "bg-orange-50 dark:bg-orange-900/10",
  Pantry:     "bg-green-50 dark:bg-green-900/10",
  Vegetables: "bg-emerald-50 dark:bg-emerald-900/10",
  Beverages:  "bg-sky-50 dark:bg-sky-900/10",
};

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={
            s <= full
              ? "fill-orange-400 text-orange-400"
              : s === full + 1 && half
              ? "fill-orange-200 text-orange-400"
              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
          }
        />
      ))}
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem    = useCartStore((s) => s.addItem);
  const items      = useCartStore((s) => s.items);
  const increment  = useCartStore((s) => s.incrementQuantity);
  const decrement  = useCartStore((s) => s.decrementQuantity);
  const budget     = useBudgetStore((s) => s.budget);
  const addRecentView = usePrefsStore((s) => s.addRecentView);
  const addToast   = useToastStore((s) => s.addToast);
  const [imgError, setImgError] = useState(false);

  const cartItem     = items.find((i) => i.id === product.id);
  const spent        = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const hasBudget    = budget > 0;
  const remaining    = hasBudget ? budget - spent : Infinity;
  const isOverBudget = hasBudget && spent >= budget;
  const wouldExceed  = hasBudget && product.price > remaining;

  const altProduct   = product.cheaperAlternativeId
    ? products.find((p) => p.id === product.cheaperAlternativeId)
    : undefined;
  const hasCheaperAlt = altProduct && product.price - altProduct.price > 10;

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const isBudgetFriendly = product.price <= 100 || discount >= 20;

  const fallbackBg = CATEGORY_FALLBACK[product.category] ?? "bg-gray-100 dark:bg-gray-800";

  const handleAddToCart = () => {
    addItem(product);
    const newSpent = spent + product.price;
    const newRemaining = hasBudget ? budget - newSpent : null;
    const msg = newRemaining !== null
      ? `Added to cart 🛒 | ${formatINR(Math.max(0, newRemaining))} left`
      : "Added to cart 🛒";
    addToast({ message: msg, type: "success", duration: 3000 });
  };

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
      onMouseEnter={() => addRecentView(product.id)}
    >
      {/* ── Image area ── */}
      <div className="relative">
        <Link to={`/product/${product.id}`} className={`block overflow-hidden ${fallbackBg}`}>
          {/* Product badge */}
          {product.badge && (
            <span
              className={`absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${BADGE_COLORS[product.badge] ?? "bg-gray-500"}`}
            >
              {product.badge}
            </span>
          )}

          {/* Discount badge */}
          {discount >= 10 && (
            <span className="absolute right-2 top-2 z-10 rounded-md bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {discount}% off
            </span>
          )}

          {!imgError ? (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
              className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-44 w-full items-center justify-center text-5xl ${fallbackBg}`}>
              🛒
            </div>
          )}
        </Link>

        {/* Quick Add overlay (appears on hover) */}
        {!cartItem && !isOverBudget && (
          <div className="quick-add-overlay absolute inset-x-0 bottom-0 flex justify-center pb-3">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600/95 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm hover:bg-orange-700 active:scale-95 transition-transform"
            >
              <Zap size={12} className="fill-white" /> Quick Add
            </button>
          </div>
        )}
      </div>

      {/* ── Details ── */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Category */}
        <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-orange-500">
          {product.category}
        </span>

        {/* Name */}
        <Link to={`/product/${product.id}`}>
          <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-800 hover:text-orange-600 dark:text-gray-100 dark:hover:text-orange-400">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating !== undefined && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <StarRow rating={product.rating} />
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{product.rating}</span>
            {product.reviews !== undefined && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                ({product.reviews.toLocaleString("en-IN")})
              </span>
            )}
          </div>
        )}

        <div className="mt-auto">
          {/* Price row */}
          <div className="mb-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-base font-bold text-gray-900 dark:text-white">₹{product.price}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-gray-400 line-through dark:text-gray-500">₹{product.mrp}</span>
            )}
          </div>

          {/* Budget tag */}
          <div className="mb-2.5">
            {wouldExceed && !cartItem ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                ⚠ Over Budget
              </span>
            ) : isBudgetFriendly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                ✓ Budget Friendly
              </span>
            ) : null}
          </div>

          {/* Cheaper alt */}
          {hasCheaperAlt && !cartItem && (
            <button
              onClick={() => addItem(altProduct!)}
              className="mb-2 flex w-full items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
            >
              <Lightbulb size={12} />
              Cheaper: ₹{altProduct!.price}
            </button>
          )}

          {/* Cart controls */}
          {cartItem ? (
            <div className="flex w-full items-center justify-between rounded-xl bg-orange-50 px-2 py-1.5 dark:bg-orange-500/10">
              <button
                onClick={() => decrement(product.id)}
                aria-label="Decrease"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm hover:bg-orange-100 active:scale-95 dark:bg-gray-800 dark:text-orange-400"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold text-gray-900 dark:text-white">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => increment(product.id)}
                aria-label="Increase"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm hover:bg-orange-100 active:scale-95 dark:bg-gray-800 dark:text-orange-400"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOverBudget}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${
                isOverBudget
                  ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                  : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/30"
              }`}
            >
              <ShoppingCart size={15} />
              {isOverBudget ? "Over Budget" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

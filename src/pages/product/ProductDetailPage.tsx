import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  BadgeCheck,
  Truck,
  RotateCcw,
  Lightbulb,
  Tag,
  Package,
  TrendingDown,
} from "lucide-react";
import { products, type Product } from "@/data/products";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { formatINR } from "@/lib/format";
import ProductCard from "@/components/ui/ProductCard";

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Fruits:
    "Farm-fresh and naturally sourced. Packed with essential vitamins, minerals, and natural goodness to fuel your day.",
  Dairy:
    "Rich, creamy dairy sourced from trusted farms. Fresh and nutritious — a cornerstone of a balanced diet.",
  Bakery:
    "Freshly baked with quality ingredients. Perfect for breakfast, a quick snack, or your family meal table.",
  Meat:
    "Premium quality protein, carefully handled for freshness. Ideal for a wide variety of home-cooked meals.",
  Grains:
    "Wholesome, high-quality grains — a pantry essential that delivers sustained energy and important nutrients.",
  Pantry:
    "A trusted everyday essential. Carefully selected for consistent quality and excellent value.",
  Vegetables:
    "Crisp and farm-fresh, sourced daily. Packed with fibre, vitamins, and the goodness your body needs.",
  Beverages:
    "Refreshing and satisfying, crafted from quality ingredients. Perfect for any time of day.",
};

const CATEGORY_BG: Record<string, string> = {
  Fruits: "bg-yellow-50 dark:bg-yellow-900/10",
  Dairy: "bg-blue-50 dark:bg-blue-900/10",
  Bakery: "bg-amber-50 dark:bg-amber-900/10",
  Meat: "bg-red-50 dark:bg-red-900/10",
  Grains: "bg-orange-50 dark:bg-orange-900/10",
  Pantry: "bg-green-50 dark:bg-green-900/10",
  Vegetables: "bg-emerald-50 dark:bg-emerald-900/10",
  Beverages: "bg-sky-50 dark:bg-sky-900/10",
};

const BADGE_COLORS: Record<string, string> = {
  Fresh: "bg-green-500",
  Bestseller: "bg-orange-500",
  Popular: "bg-blue-500",
};

// ── StarRow ───────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
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

// ── Alternative card ──────────────────────────────────────────────────────────
// Thin wrapper around ProductCard that adds a "Save ₹X" ribbon on top.

function AlternativeCard({
  alt,
  saving,
}: {
  alt: Product;
  saving: number;
}) {
  return (
    <div className="relative">
      <span className="absolute -top-2.5 left-3 z-10 flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
        <Lightbulb size={9} />
        Save {formatINR(saving)}
      </span>
      <ProductCard product={alt} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = useMemo(
    () => products.find((p) => p.id === id) ?? null,
    [id]
  );

  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.incrementQuantity);
  const decrement = useCartStore((s) => s.decrementQuantity);
  const budget = useBudgetStore((s) => s.budget);

  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // If product not found redirect to shop
  useEffect(() => {
    if (!product) navigate("/shop", { replace: true });
  }, [product, navigate]);

  const cartItem = product ? items.find((i) => i.id === product.id) : undefined;
  const totalSpent = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const isOverBudget = budget > 0 && totalSpent >= budget;

  // ── AI alternatives: cheaperAlternativeId first, then same-category cheaper ─
  const alternatives = useMemo<Product[]>(() => {
    if (!product) return [];
    const result: Product[] = [];

    if (product.cheaperAlternativeId) {
      const direct = products.find((p) => p.id === product.cheaperAlternativeId);
      if (direct && direct.price < product.price) result.push(direct);
    }

    const sameCheaper = products
      .filter(
        (p) =>
          p.category === product.category &&
          p.id !== product.id &&
          !result.some((r) => r.id === p.id) &&
          p.price < product.price
      )
      .sort((a, b) => a.price - b.price)
      .slice(0, 3 - result.length);

    return [...result, ...sameCheaper];
  }, [product]);

  // ── Related: same category, not alternatives, not current ────────────────────
  const related = useMemo<Product[]>(() => {
    if (!product) return [];
    const altIds = new Set(alternatives.map((a) => a.id));
    return products
      .filter(
        (p) =>
          p.category === product.category &&
          p.id !== product.id &&
          !altIds.has(p.id)
      )
      .slice(0, 4);
  }, [product, alternatives]);

  if (!product) return null;

  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const fallbackBg = CATEGORY_BG[product.category] ?? "bg-gray-50 dark:bg-gray-800";
  const description =
    CATEGORY_DESCRIPTIONS[product.category] ??
    "A quality product carefully selected for your household.";

  const handleAdd = () => {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-28 pt-8">
      {/* Back nav */}
      <Link
        to="/shop"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
      >
        <ArrowLeft size={15} />
        Back to Shop
      </Link>

      {/* ── Product hero ──────────────────────────────────────────────────────── */}
      <div className="mb-10 grid gap-8 md:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className={`relative overflow-hidden rounded-2xl ${fallbackBg}`}
        >
          {product.badge && (
            <span
              className={`absolute left-3 top-3 z-10 rounded px-2 py-1 text-xs font-bold uppercase tracking-wide text-white ${
                BADGE_COLORS[product.badge] ?? "bg-gray-500"
              }`}
            >
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute right-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
          {!imgError ? (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
              className="h-72 w-full object-cover md:h-[420px]"
            />
          ) : (
            <div
              className={`flex h-72 w-full items-center justify-center text-7xl ${fallbackBg} md:h-[420px]`}
            >
              🛒
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06 }}
          className="flex flex-col"
        >
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-widest text-orange-500">
            {product.category}
          </span>

          <h1 className="mb-3 text-2xl font-extrabold leading-snug text-gray-900 dark:text-white md:text-3xl">
            {product.name}
          </h1>

          {/* Rating */}
          {product.rating !== undefined && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StarRow rating={product.rating} />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {product.rating}
              </span>
              {product.reviews !== undefined && (
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  ({product.reviews.toLocaleString("en-IN")} reviews)
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="mb-5 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatINR(product.price)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-base text-gray-400 line-through dark:text-gray-500">
                  {formatINR(product.mrp)}
                </span>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  You save {formatINR(product.mrp - product.price)}
                </span>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="mb-6 flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <BadgeCheck size={14} className="text-green-500" />
              Quality Assured
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Truck size={14} className="text-orange-500" />
              Free Delivery
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <RotateCcw size={14} className="text-blue-500" />
              Easy Returns
            </span>
          </div>

          <div className="mt-auto">
            {/* Cart controls */}
            {cartItem ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 dark:bg-orange-500/10">
                  <button
                    onClick={() => decrement(product.id)}
                    aria-label="Decrease quantity"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm transition-all hover:bg-orange-100 active:scale-95 dark:bg-gray-800 dark:text-orange-400"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-[2rem] text-center text-lg font-bold text-gray-900 dark:text-white">
                    {cartItem.quantity}
                  </span>
                  <button
                    onClick={() => increment(product.id)}
                    aria-label="Increase quantity"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm transition-all hover:bg-orange-100 active:scale-95 dark:bg-gray-800 dark:text-orange-400"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <Link
                  to="/cart"
                  className="flex items-center gap-2 rounded-xl border border-orange-500 px-5 py-3 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 dark:border-orange-500/60 dark:text-orange-400 dark:hover:bg-orange-500/10"
                >
                  View Cart →
                </Link>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={isOverBudget}
                className={`flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  isOverBudget
                    ? "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    : justAdded
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                    : "bg-orange-600 text-white shadow-lg shadow-orange-600/25 hover:bg-orange-700"
                }`}
              >
                <ShoppingCart size={17} />
                {isOverBudget ? "Over Budget" : justAdded ? "Added!" : "Add to Cart"}
              </button>
            )}

            {isOverBudget && (
              <p className="mt-2 text-xs font-medium text-red-500">
                Your cart has reached the budget limit.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── About ─────────────────────────────────────────────────────────────── */}
      <section className="mb-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center gap-2">
          <Package size={16} className="text-orange-500" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            About this product
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {description}
        </p>
        {product.barcode && (
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
            Barcode:{" "}
            <span className="font-mono tracking-wider">{product.barcode}</span>
          </p>
        )}
      </section>

      {/* ── AI: Better Alternatives ───────────────────────────────────────────── */}
      {alternatives.length > 0 && (
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/20">
              <TrendingDown size={17} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Better Alternatives
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Similar products that cost less
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alt) => (
              <motion.div
                key={alt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlternativeCard alt={alt} saving={product.price - alt.price} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── More in category ──────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Tag size={15} className="text-orange-500" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              More in {product.category}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

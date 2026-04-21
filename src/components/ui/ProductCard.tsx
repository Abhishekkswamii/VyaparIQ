import { useState } from "react";
import { ShoppingCart, Minus, Plus, Star } from "lucide-react";
import type { Product } from "@/data/products";
import { useCartStore } from "@/store/cart-store";

const BADGE_COLORS: Record<string, string> = {
  Fresh: "bg-green-500",
  Bestseller: "bg-orange-500",
  Popular: "bg-blue-500",
};

const CATEGORY_FALLBACK: Record<string, string> = {
  Fruits: "bg-yellow-100",
  Dairy: "bg-blue-50",
  Bakery: "bg-amber-100",
  Meat: "bg-red-50",
  Grains: "bg-orange-50",
  Pantry: "bg-green-50",
  Vegetables: "bg-emerald-50",
  Beverages: "bg-sky-50",
};

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
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
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const increment = useCartStore((s) => s.incrementQuantity);
  const decrement = useCartStore((s) => s.decrementQuantity);
  const [imgError, setImgError] = useState(false);

  const cartItem = items.find((i) => i.id === product.id);

  const discount =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const fallbackBg = CATEGORY_FALLBACK[product.category] ?? "bg-gray-100";

  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      {/* Image area */}
      <div className={`relative overflow-hidden ${fallbackBg}`}>
        {product.badge && (
          <span
            className={`absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${BADGE_COLORS[product.badge] ?? "bg-gray-500"}`}
          >
            {product.badge}
          </span>
        )}
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`flex h-44 w-full items-center justify-center text-5xl ${fallbackBg}`}>
            🛒
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-3">
        <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-orange-500">
          {product.category}
        </span>
        <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-800 dark:text-gray-100">
          {product.name}
        </h3>

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
          <div className="mb-2.5 flex flex-wrap items-baseline gap-1.5">
            <span className="text-base font-bold text-gray-900 dark:text-white">₹{product.price}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-xs text-gray-400 line-through dark:text-gray-500">₹{product.mrp}</span>
                <span className="text-xs font-bold text-green-600">{discount}% off</span>
              </>
            )}
          </div>

          {cartItem ? (
            <div className="flex w-full items-center justify-between rounded bg-orange-50 px-2 py-1.5 dark:bg-orange-500/10">
              <button
                onClick={() => decrement(product.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm transition-all hover:bg-orange-100 active:scale-95 dark:bg-gray-800 dark:text-orange-400 dark:hover:bg-gray-700"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold text-gray-900 dark:text-white">
                {cartItem.quantity}
              </span>
              <button
                onClick={() => increment(product.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm transition-all hover:bg-orange-100 active:scale-95 dark:bg-gray-800 dark:text-orange-400 dark:hover:bg-gray-700"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(product)}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 active:scale-[0.97]"
            >
              <ShoppingCart size={15} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

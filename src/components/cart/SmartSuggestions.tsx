import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ArrowRightLeft, X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useProductStore } from "@/store/product-store";
import { formatINR } from "@/lib/format";

interface Suggestion {
  originalId: string;
  originalName: string;
  originalPrice: number;
  altId: string;
  altName: string;
  altPrice: number;
  savings: number;
}

export default function SmartSuggestions() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const storeProducts = useProductStore((s) => s.products);
  const catalog = useMemo(
    () => Object.fromEntries(storeProducts.map((p) => [p.id, p])),
    [storeProducts]
  );

  const suggestions: Suggestion[] = useMemo(() => {
    return items
      .filter((item) => {
        const product = catalog[item.id];
        if (!product?.cheaperAlternativeId) return false;
        const alt = catalog[product.cheaperAlternativeId];
        if (!alt) return false;
        return product.price - alt.price > 10;
      })
      .map((item) => {
        const product = catalog[item.id]!;
        const alt = catalog[product.cheaperAlternativeId!]!;
        return {
          originalId: item.id,
          originalName: item.name,
          originalPrice: item.price,
          altId: alt.id,
          altName: alt.name,
          altPrice: alt.price,
          savings: product.price - alt.price,
        };
      })
      .filter((s) => !dismissed.has(s.originalId));
  }, [items, catalog, dismissed]);

  if (suggestions.length === 0) return null;

  const handleSwap = (s: Suggestion) => {
    removeItem(s.originalId);
    const alt = catalog[s.altId];
    if (alt) addItem(alt);
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb size={16} className="text-amber-500" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Smart Suggestions
        </p>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {suggestions.map((s) => (
            <motion.div
              key={s.originalId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              layout
              className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800/40 dark:bg-amber-500/10"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  You added{" "}
                  <span className="font-semibold">{formatINR(s.originalPrice)} {s.originalName}</span>
                  {" — "}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatINR(s.altPrice)} {s.altName}
                  </span>{" "}
                  available{" "}
                  <span className="font-bold text-green-600 dark:text-green-400">
                    (save {formatINR(s.savings)})
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSwap(s)}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-green-700 active:scale-95"
                >
                  <ArrowRightLeft size={12} />
                  Swap
                </button>
                <button
                  onClick={() => handleDismiss(s.originalId)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <X size={11} />
                  Keep Original
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

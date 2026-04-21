import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRightLeft } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { products } from "@/data/products";
import { formatINR } from "@/lib/format";

/**
 * Budget Optimization Mode — when enabled, shows a panel that
 * suggests the cheapest possible cart (swap every item for its
 * cheapest alternative) and the total savings achievable.
 */
export default function BudgetOptimizer() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const budget = useBudgetStore((s) => s.budget);

  const catalog = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    []
  );

  const swappable = useMemo(() => {
    return items
      .filter((item) => {
        const product = catalog[item.id];
        if (!product?.cheaperAlternativeId) return false;
        const alt = catalog[product.cheaperAlternativeId];
        return alt && product.price - alt.price > 10;
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
          savings: (product.price - alt.price) * item.quantity,
          quantity: item.quantity,
        };
      });
  }, [items, catalog]);

  const totalSavings = swappable.reduce((s, i) => s + i.savings, 0);
  const price = totalPrice();

  if (budget <= 0 || swappable.length === 0) return null;

  const handleSwapAll = () => {
    swappable.forEach((s) => {
      removeItem(s.originalId);
      const alt = catalog[s.altId];
      if (alt) {
        for (let i = 0; i < s.quantity; i++) addItem(alt);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800/40 dark:bg-violet-500/10"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-500" />
          <span className="text-sm font-bold text-violet-800 dark:text-violet-300">
            Budget Optimizer
          </span>
        </div>
        <button
          onClick={handleSwapAll}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-700 active:scale-95"
        >
          <ArrowRightLeft size={12} />
          Swap All &amp; Save {formatINR(totalSavings)}
        </button>
      </div>
      <p className="mb-2 text-xs text-violet-600 dark:text-violet-400">
        Optimized total: {formatINR(price - totalSavings)} (currently {formatINR(price)})
      </p>
      <div className="space-y-1.5">
        {swappable.map((s) => (
          <div
            key={s.originalId}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-gray-600 dark:text-gray-400">
              {s.originalName} → {s.altName}
            </span>
            <span className="font-bold text-green-600 dark:text-green-400">
              Save {formatINR(s.savings)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

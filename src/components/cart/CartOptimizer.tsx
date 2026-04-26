import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ArrowRightLeft,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { useProductStore } from "@/store/product-store";
import {
  optimizeCart,
  type CartSuggestion,
  type ReplaceSuggestion,
  type RemoveSuggestion,
} from "@/lib/optimizeCart";
import { formatINR } from "@/lib/format";

// ── Suggestion row sub-components ─────────────────────────────────────────────

function ReplaceRow({
  s,
  onApply,
}: {
  s: ReplaceSuggestion;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-sm dark:bg-gray-800/70">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
        <img
          src={s.toImage}
          alt={s.toName}
          className="h-full w-full rounded-lg object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          Replace{" "}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {s.fromName}
          </span>{" "}
          <span className="text-gray-400">₹{s.fromPrice}</span>
        </p>
        <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
          ↳ {s.toName}{" "}
          <span className="text-blue-600 dark:text-blue-400">
            ₹{s.toPrice}
          </span>{" "}
          <span className="font-bold text-green-600 dark:text-green-400">
            · save {formatINR(s.savings)}
          </span>
        </p>
      </div>

      <button
        onClick={onApply}
        aria-label={`Swap ${s.fromName} with ${s.toName}`}
        className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 active:scale-95 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
      >
        Swap
      </button>
    </div>
  );
}

function RemoveRow({
  s,
  onApply,
}: {
  s: RemoveSuggestion;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 shadow-sm dark:bg-gray-800/70">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
        <Trash2 size={16} className="text-red-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-100">
          Remove {s.itemName}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {s.reason}
          <span className="ml-1 font-bold text-green-600 dark:text-green-400">
            · save {formatINR(s.savings)}
          </span>
        </p>
      </div>

      <button
        onClick={onApply}
        aria-label={`Remove ${s.itemName} from cart`}
        className="shrink-0 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100 active:scale-95 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
      >
        Remove
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CartOptimizer() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const budget = useBudgetStore((s) => s.budget);

  const [expanded, setExpanded] = useState(true);
  const [applied, setApplied] = useState(false);

  const storeProducts = useProductStore((s) => s.products);
  const catalog = useMemo(
    () => Object.fromEntries(storeProducts.map((p) => [p.id, p])),
    [storeProducts]
  );

  const result = useMemo(
    () => optimizeCart(items, budget, catalog),
    [items, budget, catalog]
  );

  // Hide when no items or no suggestions
  if (items.length === 0 || result.suggestions.length === 0) return null;

  // ── Apply a single suggestion ─────────────────────────────────────────────

  const applySuggestion = (suggestion: CartSuggestion) => {
    if (suggestion.type === "replace") {
      removeItem(suggestion.itemId);
      const alt = catalog[suggestion.toId];
      if (alt) {
        for (let i = 0; i < suggestion.quantity; i++) addItem(alt);
      }
    } else {
      removeItem(suggestion.itemId);
    }
  };

  // ── Apply all suggestions in sequence ────────────────────────────────────

  const handleApplyAll = () => {
    result.suggestions.forEach(applySuggestion);
    setApplied(true);
    setTimeout(() => setApplied(false), 1500);
  };

  const { replaceSuggestions, removeSuggestions, totalSavings, optimizedTotal } =
    result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-500/10"
    >
      {/* ── Collapsible header ─────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
            Optimize Cart
          </span>
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {result.suggestions.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            Save up to {formatINR(totalSavings)}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ChevronDown size={14} className="text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
      </button>

      {/* ── Collapsible body ───────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-emerald-200 px-4 pb-4 pt-3.5 dark:border-emerald-800/40">

              {/* Replace suggestions */}
              {replaceSuggestions.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">
                    <ArrowRightLeft size={11} />
                    Cheaper Alternatives
                  </p>
                  <div className="space-y-2">
                    {replaceSuggestions.map((s) => (
                      <ReplaceRow
                        key={s.itemId}
                        s={s}
                        onApply={() => applySuggestion(s)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Remove suggestions */}
              {removeSuggestions.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">
                    <Trash2 size={11} />
                    Unnecessary Items
                  </p>
                  <div className="space-y-2">
                    {removeSuggestions.map((s) => (
                      <RemoveRow
                        key={s.itemId}
                        s={s}
                        onApply={() => applySuggestion(s)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Savings summary bar */}
              <div className="mb-3.5 flex items-center justify-between rounded-xl bg-emerald-100/70 px-4 py-2.5 dark:bg-emerald-900/25">
                <div className="flex items-center gap-1.5">
                  <TrendingDown size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    Optimized total
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                    {formatINR(optimizedTotal)}
                  </span>
                  <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-500">
                    (save {formatINR(totalSavings)})
                  </span>
                </div>
              </div>

              {/* Apply all CTA */}
              <button
                onClick={handleApplyAll}
                disabled={applied}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                  applied
                    ? "bg-green-500 text-white"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                }`}
              >
                {applied ? (
                  <>
                    <CheckCircle2 size={15} />
                    Optimization Applied!
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    Apply Optimization · Save {formatINR(totalSavings)}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

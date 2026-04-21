import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Percent, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useOffersStore, calculateDiscount } from "@/store/offers-store";
import { useCartStore } from "@/store/cart-store";
import { formatINR } from "@/lib/format";

export default function OffersPanel() {
  const offers = useOffersStore((s) => s.offers);
  const appliedCode = useOffersStore((s) => s.appliedCode);
  const applyCode = useOffersStore((s) => s.applyCode);
  const removeCode = useOffersStore((s) => s.removeCode);
  const getAppliedOffer = useOffersStore((s) => s.getAppliedOffer);
  const items = useCartStore((s) => s.items);

  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const appliedOffer = getAppliedOffer();
  const { total: discountTotal, breakdown } = calculateDiscount(items, appliedOffer);

  const handleApply = () => {
    if (!input.trim()) return;
    const ok = applyCode(input.trim());
    if (!ok) {
      setError("Invalid coupon code");
      setTimeout(() => setError(""), 3000);
    } else {
      setInput("");
      setError("");
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-green-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
            Offers & Coupons
          </span>
          {discountTotal > 0 && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-500/20 dark:text-green-400">
              {formatINR(discountTotal)} off
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-gray-400" />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Coupon input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                placeholder="Enter code"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs uppercase outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-orange-500/20"
              />
              <button
                onClick={handleApply}
                className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
              >
                Apply
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}

            {/* Applied code */}
            {appliedCode && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                <div className="flex items-center gap-1.5">
                  <Check size={12} className="text-green-600" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-400">
                    {appliedCode}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-500">
                    applied
                  </span>
                </div>
                <button
                  onClick={removeCode}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Available offers */}
            <div className="mt-3 space-y-2">
              {offers.map((o) => (
                <div
                  key={o.id}
                  className="flex items-start gap-2 rounded-lg border border-gray-100 p-2.5 dark:border-gray-800"
                >
                  <Percent size={13} className="mt-0.5 shrink-0 text-orange-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {o.title}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      {o.description}
                    </p>
                  </div>
                  {o.type !== "auto" && (
                    <button
                      onClick={() => {
                        applyCode(o.code);
                        setInput("");
                      }}
                      disabled={appliedCode === o.code}
                      className="shrink-0 rounded-md border border-orange-200 px-2 py-1 text-[10px] font-bold text-orange-600 hover:bg-orange-50 disabled:opacity-40 dark:border-orange-700/40 dark:text-orange-400 dark:hover:bg-orange-500/10"
                    >
                      {appliedCode === o.code ? "Applied" : o.code}
                    </button>
                  )}
                  {o.type === "auto" && (
                    <span className="shrink-0 rounded-md bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      Auto
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Discount breakdown */}
            {breakdown.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-gray-100 pt-2 dark:border-gray-800">
                {breakdown.map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-green-600 dark:text-green-400">
                      {b.label}
                    </span>
                    <span className="font-bold text-green-700 dark:text-green-300">
                      -{formatINR(b.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

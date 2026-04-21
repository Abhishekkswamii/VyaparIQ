import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, ShoppingBag, ArrowRight, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useSessionStore } from "@/store/session-store";
import { formatINR } from "@/lib/format";
import { generateReceipt } from "@/lib/generate-receipt";

export default function CheckoutSummaryModal() {
  const show = useSessionStore((s) => s.showSummary);
  const summary = useSessionStore((s) => s.lastSummary);
  const close = useSessionStore((s) => s.closeSummary);

  return (
    <AnimatePresence>
      {show && summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/20">
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Checkout Complete!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Session summary
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
                  {formatINR(summary.totalSpent)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Items</p>
                <p className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
                  {summary.itemCount}
                </p>
              </div>
              {summary.budget > 0 && (
                <>
                  <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Budget</p>
                    <p className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
                      {formatINR(summary.budget)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Budget vs Actual
                    </p>
                    <p
                      className={`mt-1 text-lg font-extrabold ${
                        summary.totalSpent <= summary.budget
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {summary.totalSpent <= summary.budget
                        ? `${formatINR(summary.budget - summary.totalSpent)} saved`
                        : `${formatINR(summary.totalSpent - summary.budget)} over`}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Items list */}
            {summary.items.length > 0 && (
              <div className="mb-5 max-h-40 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {summary.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={13} className="text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-400">x{item.quantity}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download receipt */}
            <button
              onClick={() => generateReceipt(summary)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <FileDown size={14} />
              Download PDF Receipt
            </button>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                to="/dashboard"
                onClick={close}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white transition-all hover:bg-orange-700 active:scale-[0.98]"
              >
                Overview
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/shop"
                onClick={close}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, LayoutDashboard, CheckCircle2, Package } from "lucide-react";
import { formatINR } from "@/lib/format";

interface OrderSuccessState {
  total?: number;
  itemCount?: number;
}

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const { total, itemCount } = (state as OrderSuccessState) ?? {};

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-5 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-green-100 dark:bg-green-500/20"
        >
          <CheckCircle2 size={52} className="text-green-600 dark:text-green-400" strokeWidth={1.5} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-3xl font-extrabold text-gray-900 dark:text-white"
        >
          Order Placed! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
        >
          Your order has been confirmed and will be delivered soon.
        </motion.p>

        {/* Order summary card */}
        {(total !== undefined || itemCount !== undefined) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Items ordered</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {itemCount ?? "—"}
              </span>
            </div>

            {total !== undefined && (
              <>
                <div className="my-4 h-px bg-gray-100 dark:bg-gray-800" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Amount paid</span>
                  <span className="text-xl font-extrabold text-orange-600 dark:text-orange-400">
                    {formatINR(total)}
                  </span>
                </div>
              </>
            )}

            <div className="mt-5 flex items-center justify-center gap-1.5 rounded-xl bg-green-50 py-2.5 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
              <CheckCircle2 size={13} />
              Free delivery · Est. 30–45 mins
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>

          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Package size={16} />
            View My Orders
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <LayoutDashboard size={16} />
            Go to Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "@/store/cart-store";
import { useCartUIStore } from "@/store/cart-ui-store";
import CartDrawerItem from "./CartDrawerItem";
import CartSummary from "./CartSummary";

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartUIStore((s) => s.isDrawerOpen);
  const close = useCartUIStore((s) => s.closeDrawer);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl sm:w-[380px] dark:bg-gray-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Your Cart
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Quick Preview
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-gray-800 dark:hover:text-orange-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-4xl dark:bg-gray-800">
                  🛒
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    Cart is empty
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Start adding items to see them here!
                  </p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={close}
                  className="mt-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 scrollbar-hide">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">Recently Added</span>
                    <Link
                      to="/cart"
                      onClick={close}
                      className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:underline"
                    >
                      View Full Cart
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartDrawerItem key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>
                <CartSummary />
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

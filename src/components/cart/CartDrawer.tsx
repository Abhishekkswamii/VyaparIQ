import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCartUIStore } from "@/store/cart-ui-store";
import CartItem from "./CartItem";
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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Your Cart
                </h2>
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
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
                <span className="text-5xl opacity-30">🛒</span>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Your cart is empty
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartItem key={item.id} item={item} />
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

import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCartUIStore } from "@/store/cart-ui-store";

export default function CartBar() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const openDrawer = useCartUIStore((s) => s.openDrawer);

  const count = totalItems();
  const price = totalPrice();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <button
            onClick={openDrawer}
            className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-lg dark:bg-orange-500/20">
                🛒
              </span>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {count} {count === 1 ? "item" : "items"}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  ₹{price.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600">
              View Cart
              <ChevronUp size={16} />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCartUIStore } from "@/store/cart-ui-store";
import { formatINR } from "@/lib/format";

export default function CartBar() {
  const items = useCartStore((s) => s.items);
  const count = useCartStore((s) => s.itemCount);
  const price = useCartStore((s) => s.totalAmount);
  const openDrawer = useCartUIStore((s) => s.openDrawer);

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur-md shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-950/95"
        >
          <button
            onClick={openDrawer}
            className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
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
                  {formatINR(price)}
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

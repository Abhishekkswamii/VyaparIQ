import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { formatINR } from "@/lib/format";
import { motion } from "framer-motion";

interface Props {
  item: CartItem;
}

export default function CartDrawerItem({ item }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex gap-4 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-800/50"
    >
      {/* Image */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            📦
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <h4 className="line-clamp-1 text-sm font-bold text-gray-900 dark:text-white">
            {item.name}
          </h4>
          <p className="mt-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
            {formatINR(item.price)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-900">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-orange-600 dark:hover:bg-gray-800"
            >
              <Minus size={12} />
            </button>
            <span className="min-w-[1.5rem] text-center text-xs font-bold text-gray-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-orange-600 dark:hover:bg-gray-800"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => removeItem(item.id)}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

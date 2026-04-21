import { Minus, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { CartItem as CartItemType } from "@/store/cart-store";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { formatINR } from "@/lib/format";
import { useFamilyStore } from "@/store/family-store";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const increment = useCartStore((s) => s.incrementQuantity);
  const decrement = useCartStore((s) => s.decrementQuantity);
  const remove = useCartStore((s) => s.removeItem);
  const budget = useBudgetStore((s) => s.budget);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const isOverBudget = budget > 0 && totalPrice() > budget;
  const familyEnabled = useFamilyStore((s) => s.enabled);
  const members = useFamilyStore((s) => s.members);
  const addedByMember = familyEnabled && item.addedBy
    ? members.find((m) => m.id === item.addedBy)
    : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 rounded-xl p-3 ${isOverBudget ? "cart-item-over" : "bg-gray-50 dark:bg-gray-800"}`}
    >
      <div className="flex h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            {item.name}
          </p>
          {addedByMember && (
            <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] dark:bg-gray-700" title={`Added by ${addedByMember.name}`}>
              {addedByMember.avatar}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-orange-500">
          {formatINR(item.price * item.quantity)}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => decrement(item.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-orange-100 hover:text-orange-600 active:scale-95 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-orange-500/20 dark:hover:text-orange-400"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">
          {item.quantity}
        </span>
        <button
          onClick={() => increment(item.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-orange-100 hover:text-orange-600 active:scale-95 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-orange-500/20 dark:hover:text-orange-400"
        >
          <Plus size={14} />
        </button>
      </div>

      <button
        onClick={() => remove(item.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95 dark:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}

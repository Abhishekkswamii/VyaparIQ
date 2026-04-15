import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { useThemeStore } from "@/store/theme-store";
import { useCartUIStore } from "@/store/cart-ui-store";
import { useBudgetStore } from "@/store/budget-store";

export default function Navbar() {
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);
  const toggleDrawer = useCartUIStore((s) => s.toggleDrawer);
  const budget = useBudgetStore((s) => s.budget);
  const { pathname } = useLocation();

  const count = totalItems();
  const spent = totalPrice();
  const hasBudget = budget > 0;
  const isOverBudget = hasBudget && spent > budget;
  const remaining = hasBudget ? budget - spent : 0;

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:block ${
        pathname === to
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link to="/shop" className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            SmartCart
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink("/shop", "Shop")}
          {navLink("/dashboard", "Dashboard")}

          {/* Budget remaining pill */}
          <AnimatePresence>
            {hasBudget && (
              <motion.span
                key="budget-pill"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`ml-1 hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:block ${
                  isOverBudget
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                }`}
              >
                {isOverBudget
                  ? `−₹${(spent - budget).toFixed(2)}`
                  : `₹${remaining.toFixed(2)} left`}
              </motion.span>
            )}
          </AnimatePresence>

          <div className="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />

          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={toggleDrawer}
            aria-label="Open cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ShoppingCart size={20} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  );
}

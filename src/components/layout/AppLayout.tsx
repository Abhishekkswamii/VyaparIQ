import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, ShoppingCart, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useCartStore } from "@/store/cart-store";
import { useCartUIStore } from "@/store/cart-ui-store";
import { useBudgetStore } from "@/store/budget-store";
import { formatINR } from "@/lib/format";
import { useAlerts } from "@/hooks/useAlerts";
import ToastContainer from "@/components/ui/ToastContainer";
import CheckoutSummaryModal from "@/components/cart/CheckoutSummaryModal";
import ScanFab from "@/components/scanner/ScanFab";
import PennyChatbot from "@/components/chat/PennyChatbot";
import Sidebar from "./Sidebar";
import CartBar from "@/components/cart/CartBar";
import CartDrawer from "@/components/cart/CartDrawer";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/shop": "Shop",
  "/cart": "Smart Cart",
  "/analytics": "Analytics",
};

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const toggleDrawer = useCartUIStore((s) => s.toggleDrawer);
  const budget = useBudgetStore((s) => s.budget);
  const { pathname } = useLocation();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { pct, isOverBudget: alertOver } = useAlerts();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const count = totalItems();
  const spent = totalPrice();
  const hasBudget = budget > 0;
  const isOverBudget = hasBudget && spent > budget;
  const remaining = hasBudget ? budget - spent : 0;
  const pageTitle = PAGE_TITLES[pathname] ?? "SmartCart AI";

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Sidebar
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-500 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-bold text-gray-800 sm:text-lg dark:text-white">
              {pageTitle}
            </h1>
          </div>

          {/* Right: budget pill + theme + cart */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AnimatePresence>
              {hasBudget && (
                <motion.span
                  key="budget-pill"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold sm:flex ${
                    isOverBudget
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : remaining / budget < 0.2
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                  }`}
                >
                  {/* Budget Health Indicator dot */}
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      alertOver
                        ? "bg-red-500 pulse-dot"
                        : pct > 90
                        ? "bg-red-500 pulse-dot"
                        : pct > 70
                        ? "bg-amber-400"
                        : "bg-green-500"
                    }`}
                  />
                  {isOverBudget
                    ? `Over ${formatINR(spent - budget)}`
                    : `${formatINR(remaining)} left`}
                </motion.span>
              )}
            </AnimatePresence>

            <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                toggle();
              }}
              aria-label="Toggle dark mode"
              className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={toggleDrawer}
              aria-label="Open cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
            >
              <ShoppingCart size={20} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CartBar />
      <CartDrawer />
      <ToastContainer />
      <CheckoutSummaryModal />
      <ScanFab />
      <PennyChatbot />
    </div>
  );
}

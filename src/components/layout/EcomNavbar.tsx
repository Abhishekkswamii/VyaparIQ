import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Moon,
  Sun,
  Package,
  BarChart3,
  LogOut,
  ChevronDown,
  Wallet,
  X,
  UserCircle,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCartUIStore } from "@/store/cart-ui-store";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { formatINR } from "@/lib/format";

interface EcomNavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function EcomNavbar({ searchQuery, onSearchChange }: EcomNavbarProps) {
  const navigate = useNavigate();
  const count = useCartStore((s) => s.itemCount);
  const isDrawerOpen = useCartUIStore((s) => s.isDrawerOpen);
  const { totalBudget: budget, totalSpent: spent, remainingBudget: remaining, usedPercentage: pct, hasBudget, isOverBudget } = useBudgetSummary();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);

  const { pathname } = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : "User";
  const initials = user
    ? [user.firstName, user.lastName]
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "U"
    : "U";

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when mobile search opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const budgetPillColor = isOverBudget
    ? "bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : pct > 70
    ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
    : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";

  const budgetDot = isOverBudget
    ? "bg-red-500 pulse-dot"
    : pct > 70
    ? "bg-amber-400"
    : "bg-green-500";

  return (
    <header className="relative">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* ── Logo ── */}
        <Link
          to="/dashboard"
          className="flex shrink-0 items-center gap-2 mr-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/30">
            <ShoppingCart size={18} className="text-white" />
          </div>
          <span className="hidden text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:block">
            Vyapar<span className="text-orange-500">IQ</span>
          </span>
        </Link>

        {/* ── Search bar (desktop) ── */}
        <div className="hidden flex-1 sm:block max-w-2xl">
          <div className="relative group">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for products..."
              className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm font-medium text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:shadow-md focus:shadow-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-orange-500 dark:focus:bg-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── Right section ── */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-orange-50 hover:text-orange-500 transition-colors sm:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          {/* Budget pill */}
          <AnimatePresence>
            {hasBudget && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors duration-300 ${budgetPillColor}`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${budgetDot}`} />
                <Wallet size={12} />
                {isOverBudget
                  ? `Over ${formatINR(spent - budget)}`
                  : `${formatINR(remaining)} left`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Quick-access nav links ── */}
          <div className="hidden sm:flex items-center gap-0.5">
            {[
              { to: "/orders", icon: Package, label: "My Orders" },
              { to: "/analytics", icon: BarChart3, label: "Analytics" },
            ].map(({ to, icon: Icon, label }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                      : "text-gray-500 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-orange-500" : "text-gray-400"} />
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Dark mode */}
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
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
                  <Sun size={18} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Cart button */}
          <button
            onClick={() => {
              if (count === 0) {
                navigate("/cart");
              } else if (useCartUIStore.getState().isDrawerOpen) {
                navigate("/cart");
                useCartUIStore.getState().closeDrawer();
              } else {
                useCartUIStore.getState().openDrawer();
              }
            }}
            aria-label="Open cart"
            className="relative flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
          >
            <div className="relative">
              <ShoppingCart size={19} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white shadow-sm"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {count > 0 && (
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isDrawerOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-orange-400"
              aria-label="Profile menu"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-[11px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <ChevronDown
                size={14}
                className={`hidden sm:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                >
                  {/* User info */}
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                      {user?.email ?? ""}
                    </p>
                  </div>

                  {/* Links */}
                  <div className="py-1.5">
                    {[
                      { to: "/profile", icon: UserCircle, label: "My Profile" },
                      { to: "/orders", icon: Package, label: "My Orders" },
                      { to: "/analytics", icon: BarChart3, label: "Analytics" },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-orange-400"
                      >
                        <Icon size={15} className="text-gray-400" />
                        {label}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 py-1.5 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile search overlay ── */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-0 top-0 z-10 flex h-16 items-center gap-3 bg-white px-4 shadow-lg dark:bg-gray-900 sm:hidden"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search for products..."
                className="w-full rounded-xl border-2 border-orange-400 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={() => { setMobileSearchOpen(false); onSearchChange(""); }}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-gray-500"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}

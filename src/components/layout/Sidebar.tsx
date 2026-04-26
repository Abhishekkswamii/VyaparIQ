import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  BarChart3,
  Package,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { APP_NAME } from "@/constants/branding";

interface SidebarProps {
  isMobileOpen: boolean;
  closeMobile: () => void;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/cart", label: "Cart", icon: ShoppingCart, showBadge: true },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/orders", label: "My Orders", icon: Package },
];

function SidebarInner({ closeMobile }: { closeMobile: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const totalItems = useCartStore((s) => s.totalItems);
  const cartCount = totalItems();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900">
      {/* Logo — orange gradient header */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 bg-gradient-to-r from-orange-500 to-amber-500 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
          <ShoppingBag size={18} className="text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-white">
          {APP_NAME}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
          Menu
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, showBadge }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                  : "text-gray-600 hover:bg-orange-50/60 hover:text-orange-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-orange-500"
                />
              )}
              <Icon
                size={18}
                className={
                  isActive
                    ? "text-orange-500 dark:text-orange-400"
                    : "text-gray-400 transition-colors group-hover:text-orange-400 dark:text-gray-500 dark:group-hover:text-orange-400"
                }
              />
              <span className="flex-1">{label}</span>
              {showBadge && cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="shrink-0 border-t border-gray-100 p-3 dark:border-gray-800">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </p>
            <p className="truncate text-xs text-gray-400 dark:text-gray-500">
              {user?.email ?? ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isMobileOpen, closeMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white lg:block dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <SidebarInner closeMobile={closeMobile} />
        </div>
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-60 bg-white shadow-2xl lg:hidden dark:bg-gray-900"
            >
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="absolute right-3 top-3.5 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
              <SidebarInner closeMobile={closeMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

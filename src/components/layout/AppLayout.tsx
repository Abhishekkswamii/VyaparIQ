import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import ToastContainer from "@/components/ui/ToastContainer";
import CheckoutSummaryModal from "@/components/cart/CheckoutSummaryModal";
import ScanFab from "@/components/scanner/ScanFab";
import VyraChatbot from "@/components/chat/VyraChatbot";
import CartDrawer from "@/components/cart/CartDrawer";
import EcomNavbar from "./EcomNavbar";
import ContextHeader from "./ContextHeader";
import type { CategoryId } from "./CategoryBar";

export interface AppOutletCtx {
  searchQuery: string;
  activeCategory: CategoryId;
  statusFilter: string;
  orderSearch: string;
  dateRange: string;
}

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* ── Unified HeaderShell: single sticky surface, no internal seams ── */}
      <div
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 dark:bg-gray-900 ${
          scrolled
            ? "shadow-md dark:shadow-gray-950/60"
            : "shadow-sm shadow-gray-100/80 dark:shadow-gray-950/40"
        }`}
      >
        <EcomNavbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ContextHeader
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          orderSearch={orderSearch}
          onOrderSearch={setOrderSearch}
          dateRange={dateRange}
          onDateChange={setDateRange}
        />
      </div>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet
          context={{
            searchQuery,
            activeCategory,
            statusFilter,
            orderSearch,
            dateRange,
          } satisfies AppOutletCtx}
        />
      </main>

      {/* ── Global overlays / fixed UI ── */}
      <CartDrawer />
      <ToastContainer />
      <CheckoutSummaryModal />
      <ScanFab />
      <VyraChatbot />
    </div>
  );
}

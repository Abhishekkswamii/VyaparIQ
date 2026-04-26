import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import ToastContainer from "@/components/ui/ToastContainer";
import CheckoutSummaryModal from "@/components/cart/CheckoutSummaryModal";
import ScanFab from "@/components/scanner/ScanFab";
import PennyChatbot from "@/components/chat/PennyChatbot";
import CartBar from "@/components/cart/CartBar";
import CartDrawer from "@/components/cart/CartDrawer";
import EcomNavbar from "./EcomNavbar";
import CategoryBar from "./CategoryBar";
import type { CategoryId } from "./CategoryBar";

// CategoryBar is only useful on /dashboard (product browsing).
// All other customer pages still get the EcomNavbar but skip it.
const CATEGORY_BAR_ROUTES = ["/dashboard"];

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { pathname } = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("All");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const showCategoryBar = CATEGORY_BAR_ROUTES.includes(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* ── Sticky top chrome ── */}
      <EcomNavbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      {showCategoryBar && (
        <CategoryBar active={activeCategory} onChange={setActiveCategory} />
      )}

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet context={{ searchQuery, activeCategory }} />
      </main>

      {/* ── Global overlays / fixed UI ── */}
      <CartDrawer />
      <ToastContainer />
      <CheckoutSummaryModal />
      <ScanFab />
      <PennyChatbot />
    </div>
  );
}

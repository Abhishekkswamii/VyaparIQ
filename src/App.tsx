import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const AppLayout            = lazy(() => import("./components/layout/AppLayout"));
const LandingPage          = lazy(() => import("./pages/landing/LandingPage"));
const LoginPage            = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage           = lazy(() => import("./pages/auth/SignupPage"));
const OAuthSuccessPage     = lazy(() => import("./pages/auth/OAuthSuccessPage"));
const ForgotPasswordPage   = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage    = lazy(() => import("./pages/auth/ResetPasswordPage"));
const DashboardPage        = lazy(() => import("./pages/dashboard/DashboardPage"));
const ShopPage             = lazy(() => import("./pages/shop/ShopPage"));
const CartPage             = lazy(() => import("./pages/cart/CartPage"));
const AnalyticsPage        = lazy(() => import("./pages/analytics/AnalyticsPage"));
const CheckoutPage         = lazy(() => import("./pages/checkout/CheckoutPage"));
const OrderSuccessPage     = lazy(() => import("./pages/order-success/OrderSuccessPage"));
const ProductDetailPage    = lazy(() => import("./pages/product/ProductDetailPage"));
const OrdersPage           = lazy(() => import("./pages/orders/OrdersPage"));
const OrderTrackingPage    = lazy(() => import("./pages/orders/OrderTrackingPage"));
const OrderConfirmationPage = lazy(() => import("./pages/orders/OrderConfirmationPage"));
const ProfilePage          = lazy(() => import("./pages/profile/ProfilePage"));
const AdminLogin           = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout          = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard       = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts        = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders          = lazy(() => import("./pages/admin/AdminOrders"));
const AdminInventory       = lazy(() => import("./pages/admin/AdminInventory"));
const AdminInvoices        = lazy(() => import("./pages/admin/AdminInvoices"));

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import { useThemeStore } from "./store/theme-store";

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );
}

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/oauth-success" element={<OAuthSuccessPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id/track" element={<OrderTrackingPage />} />
          <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"  element={<AdminDashboard />} />
          <Route path="products"   element={<AdminProducts />} />
          <Route path="orders"     element={<AdminOrders />} />
          <Route path="inventory"  element={<AdminInventory />} />
          <Route path="invoices"   element={<AdminInvoices />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

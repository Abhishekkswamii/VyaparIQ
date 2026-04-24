import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

/**
 * Wraps routes that require role === "admin".
 * - Not authenticated → /login
 * - Authenticated but not admin → /dashboard
 */
export default function AdminRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

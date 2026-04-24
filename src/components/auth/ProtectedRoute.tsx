import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

/**
 * Wraps routes that require the user to be authenticated.
 * Redirects to /login if not authenticated.
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

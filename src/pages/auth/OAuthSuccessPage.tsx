import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

/**
 * Landing page after Google OAuth.
 * URL: /oauth-success?token=<JWT>
 *
 * Decodes the JWT payload (no signature verification needed — backend already
 * verified it), hydrates the auth store, then redirects by role.
 */
export default function OAuthSuccessPage() {
  const setFromOAuth = useAuthStore((s) => s.setFromOAuth);
  const navigate = useNavigate();
  // Guard so the handler runs at most once per page-lifetime.
  // Without this, React 18 StrictMode (and Suspense remounts) double-invoke
  // the effect — the second run sees the post-navigation URL (/dashboard,
  // no token) and incorrectly redirects to /login?error=oauth_missing_token.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login?error=oauth_missing_token", { replace: true });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setFromOAuth(token, payload);
      // Use navigate (no full reload) so Zustand in-memory auth state is
      // immediately available to ProtectedRoute — no race with localStorage flush.
      navigate(
        payload.role === "admin" ? "/admin/dashboard" : "/dashboard",
        { replace: true }
      );
    } catch {
      navigate("/login?error=oauth_invalid_token", { replace: true });
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Completing sign-in…
        </p>
      </div>
    </div>
  );
}

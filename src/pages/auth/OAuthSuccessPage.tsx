import { useEffect } from "react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      // No token in URL — OAuth handshake did not complete
      window.location.replace("/login?error=oauth_missing_token");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setFromOAuth(token, payload);
      // Use window.location.replace for a full reload so:
      //  1. Zustand persist rehydrates with the newly stored token
      //  2. React 18 StrictMode double-invocation cannot re-run this effect
      window.location.replace(
        payload.role === "admin" ? "/admin/dashboard" : "/dashboard"
      );
    } catch {
      window.location.replace("/login?error=oauth_invalid_token");
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

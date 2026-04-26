import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin";
  provider: "local" | "google";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  /** Calls /api/auth/login — returns the user's role on success */
  login: (email: string, password: string) => Promise<"user" | "admin">;
  /** Calls /api/auth/register — logs in immediately after */
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  /** Set auth state from a Google OAuth JWT (decoded payload) */
  setFromOAuth: (token: string, payload: AuthUser & { exp?: number }) => void;
  logout: () => Promise<void>;
}

// ── Safe JSON helper ──────────────────────────────────────────────────────────
// Prevents "Unexpected end of JSON input" when the server returns an empty
// body, an HTML error page, or any non-JSON response.

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    // Server returned HTML, plain text, or nothing — construct a fallback object
    const text = await res.text().catch(() => "");
    return { error: text || res.statusText || "Unexpected server response" };
  }
  try {
    return await res.json();
  } catch {
    return { error: "Invalid JSON received from server" };
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error((data.error as string) ?? "Login failed");
        set({ user: data.user as AuthUser, token: data.token as string, isAuthenticated: true });
        return (data.user as AuthUser).role;
      },

      signup: async (firstName, lastName, email, password) => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, email, password }),
        });
        const data = await safeJson(res);
        if (!res.ok) {
          const errs = data.errors as Array<{ msg: string }> | undefined;
          throw new Error(errs?.[0]?.msg ?? (data.error as string) ?? "Registration failed");
        }
        set({ user: data.user as AuthUser, token: data.token as string, isAuthenticated: true });
      },

      setFromOAuth: (token, payload) => {
        const user: AuthUser = {
          id: payload.id,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          role: payload.role,
          provider: payload.provider,
        };
        set({ user, token, isAuthenticated: true });
      },

      logout: async () => {
        const { token } = get();
        // Attempt to blacklist the token in Redis — best-effort, don't block UI
        if (token) {
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch {
            // Network error on logout — still clear local state
          }
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "vyapariq-auth",
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

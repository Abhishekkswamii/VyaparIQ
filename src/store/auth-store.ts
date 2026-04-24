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
  logout: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Login failed");
        set({ user: data.user, token: data.token, isAuthenticated: true });
        return data.user.role as "user" | "admin";
      },

      signup: async (firstName, lastName, email, password) => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.errors?.[0]?.msg ?? data.error ?? "Registration failed");
        }
        set({ user: data.user, token: data.token, isAuthenticated: true });
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

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
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

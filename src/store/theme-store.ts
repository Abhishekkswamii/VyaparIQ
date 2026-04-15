import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

const getInitialTheme = (): boolean => {
  try {
    const stored = localStorage.getItem("smartcart-theme");
    if (stored !== null) return stored === "dark";
  } catch {}
  return false;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: getInitialTheme(),
  toggle: () => {
    const next = !get().isDark;
    // Direct DOM manipulation — no waiting for React re-render
    document.documentElement.classList.toggle("dark", next);
    set({ isDark: next });
    try {
      localStorage.setItem("smartcart-theme", next ? "dark" : "light");
    } catch {}
  },
}));

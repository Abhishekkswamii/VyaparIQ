import { create } from "zustand";

export type ToastType = "success" | "warning" | "danger" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++counter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const ms = toast.duration ?? 5000;
    if (ms > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, ms);
    }
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

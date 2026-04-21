import { X } from "lucide-react";
import { useToastStore, type Toast } from "@/store/toast-store";

const STYLES: Record<string, string> = {
  success:
    "border-green-400 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  warning:
    "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  danger:
    "border-red-400 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  info: "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.removeToast);
  return (
    <div
      className={`toast-slide-in flex items-start gap-2 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm ${
        STYLES[toast.type] ?? STYLES.info
      }`}
    >
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => remove(toast.id)}
        className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

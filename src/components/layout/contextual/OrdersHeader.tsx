import { motion } from "framer-motion";
import { RefreshCw, Search, X } from "lucide-react";
import { useOrdersStore, type OrderStatus } from "@/store/orders-store";
import type { ContextHeaderProps } from "./types";

const STATUS_TABS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function OrdersHeader({
  statusFilter,
  onStatusChange,
  orderSearch,
  onOrderSearch,
}: ContextHeaderProps) {
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const loading = useOrdersStore((s) => s.loading);
  const orders = useOrdersStore((s) => s.orders);

  return (
    <div>
      {/* ── Top bar: title + search + refresh ── */}
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
        <div className="shrink-0">
          <p className="text-base font-extrabold text-gray-900 dark:text-white">
            My Orders
          </p>
          {orders.length > 0 && !loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative ml-auto max-w-xs flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => onOrderSearch(e.target.value)}
            placeholder="Search orders…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-7 text-sm outline-none transition focus:border-orange-400 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-orange-500 dark:focus:bg-gray-900"
          />
          {orderSearch && (
            <button
              onClick={() => onOrderSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchOrders}
          disabled={loading}
          aria-label="Refresh orders"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="scrollbar-hide mx-auto flex max-w-3xl items-center overflow-x-auto px-5">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`relative shrink-0 px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="orders-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-orange-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

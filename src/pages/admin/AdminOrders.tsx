import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ChevronDown, ShoppingBag } from "lucide-react";
import { useAdminStore, type AdminOrder } from "@/store/admin-store";
import { formatINR } from "@/lib/format";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = [
  "pending", "confirmed", "processing", "shipped",
  "out_for_delivery", "delivered", "cancelled",
] as const;

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending",          cls: "bg-yellow-500/15 text-yellow-400" },
  confirmed:        { label: "Confirmed",         cls: "bg-blue-500/15 text-blue-400" },
  processing:       { label: "Processing",        cls: "bg-indigo-500/15 text-indigo-400" },
  shipped:          { label: "Shipped",           cls: "bg-purple-500/15 text-purple-400" },
  out_for_delivery: { label: "Out for Delivery",  cls: "bg-orange-500/15 text-orange-400" },
  delivered:        { label: "Delivered",         cls: "bg-green-500/15 text-green-400" },
  cancelled:        { label: "Cancelled",         cls: "bg-red-500/15 text-red-400" },
};

// ── Row component ─────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: AdminOrder }) {
  const updateOrderStatus = useAdminStore((s) => s.updateOrderStatus);
  const [updating, setUpdating] = useState(false);
  const [open,     setOpen]     = useState(false);

  const handleStatus = async (status: string) => {
    setUpdating(true);
    try { await updateOrderStatus(order.id, status); }
    catch { /* toast */ }
    finally { setUpdating(false); setOpen(false); }
  };

  const cfg  = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
  const date = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <tr className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-gray-300">#{order.id}</td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-white truncate max-w-[140px]">{[order.first_name, order.last_name].filter(Boolean).join(" ") || "—"}</p>
        <p className="text-xs text-gray-500 truncate max-w-[140px]">{order.email}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300">{order.item_count}</td>
      <td className="px-4 py-3 text-sm font-bold text-white">
        {formatINR(parseFloat(order.total_amount))}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{date}</td>
      <td className="px-4 py-3">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setOpen((v) => !v)}
            disabled={updating}
            className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            Update <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-gray-700 bg-gray-900 shadow-xl"
              >
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    className={`block w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-gray-800 transition-colors
                      ${s === order.status ? "text-orange-400" : "text-gray-300"}`}
                  >
                    {STATUS_STYLE[s]?.label ?? s}
                    {s === order.status && " ✓"}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminOrders() {
  const orders        = useAdminStore((s) => s.orders);
  const ordersTotal   = useAdminStore((s) => s.ordersTotal);
  const ordersLoading = useAdminStore((s) => s.ordersLoading);
  const fetchAdminOrders = useAdminStore((s) => s.fetchAdminOrders);

  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchAdminOrders(100);
  }, [fetchAdminOrders]);

  const filtered = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Orders</h1>
          <p className="mt-0.5 text-sm text-gray-400">{ordersTotal} total orders</p>
        </div>
        <button
          onClick={() => fetchAdminOrders(100)}
          disabled={ordersLoading}
          className="flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          <RefreshCw size={14} className={ordersLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors
              ${filterStatus === s
                ? "bg-orange-500 text-white"
                : "border border-gray-700 text-gray-400 hover:border-orange-500 hover:text-orange-400"
              }`}
          >
            {s === "all" ? "All" : STATUS_STYLE[s]?.label ?? s}
            {s !== "all" && (
              <span className="ml-1.5 opacity-60">
                {orders.filter((o) => o.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-900/80">
              {["Order #", "Customer", "Items", "Amount", "Status", "Date", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-800">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-500">
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
                  No orders found
                </td>
              </tr>
            ) : (
              filtered.map((order) => <OrderRow key={order.id} order={order} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

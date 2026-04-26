import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { AppOutletCtx } from "@/components/layout/AppLayout";
import {
  Package,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  Navigation,
  Download,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import {
  useOrdersStore,
  type OrderSummary,
  type OrderStatus,
} from "@/store/orders-store";
import { formatINR } from "@/lib/format";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color:
      "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    icon: RefreshCw,
  },
  shipped: {
    label: "Shipped",
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    icon: CheckCircle2,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    icon: Truck,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-3 h-3 w-40 rounded bg-gray-100 dark:bg-gray-800" />
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const fetchOrderDetail = useOrdersStore((s) => s.fetchOrderDetail);
  const detailCache = useOrdersStore((s) => s.detailCache);
  const detailLoading = useOrdersStore((s) => s.detailLoading);
  const token = useAuthStore((s) => s.token);

  const handleDownload = async () => {
    if (!token) return;
    setDlLoading(true);
    try {
      const r    = await fetch(`/api/invoices/${order.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${order.invoice_id ?? `invoice-${order.id}`}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally { setDlLoading(false); }
  };

  const items = detailCache[order.id];
  const isDetailLoading = detailLoading[order.id];

  const toggleExpand = () => {
    if (!expanded) fetchOrderDetail(order.id);
    setExpanded((v) => !v);
  };

  const date = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const total = parseFloat(order.total_amount);
  const discount = parseFloat(order.discount);
  const addr = order.delivery_address;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      {/* ── Card header ─────────────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
              Order #{order.id}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {date}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
              {formatINR(total)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {order.item_count} {order.item_count === 1 ? "item" : "items"}
              {discount > 0 && (
                <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                  · Saved {formatINR(discount)}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/orders/${order.id}/track`}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-colors"
            >
              <Navigation size={12} /> Track
            </Link>
            {order.invoice_id && (
              <button
                onClick={handleDownload}
                disabled={dlLoading}
                title="Download invoice"
                className="flex items-center gap-1.5 rounded-xl border border-orange-200 px-3.5 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-60 dark:border-orange-800 dark:text-orange-400"
              >
                <Download size={12} /> {dlLoading ? "…" : "Invoice"}
              </button>
            )}
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-gray-700 dark:text-gray-400"
            >
              {expanded ? <><ChevronUp size={12} />Hide</> : <><ChevronDown size={12} />Details</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expandable detail ────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">
              {isDetailLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                  <Loader2 size={15} className="animate-spin" />
                  Loading items…
                </div>
              ) : items && items.length > 0 ? (
                <>
                  {/* Items table */}
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                    Items
                  </p>
                  <div className="mb-4 space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 dark:bg-gray-800/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                            {item.name}
                          </p>
                          {item.category && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {item.category}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatINR(parseFloat(item.line_total))}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatINR(parseFloat(item.price))} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {/* Delivery address */}
              {addr && (
                <div className="rounded-xl bg-orange-50 p-3.5 dark:bg-orange-500/10">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                    Delivered to
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {addr.name}
                    </p>
                    <p className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin size={12} className="mt-0.5 shrink-0 text-orange-400" />
                      {addr.address}, {addr.city} — {addr.pincode}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Phone size={12} className="shrink-0 text-orange-400" />
                      {addr.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-4xl dark:bg-orange-500/20">
        <Package size={38} className="text-orange-500" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
        No orders yet
      </h2>
      <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Your order history will appear here after you place your first order.
      </p>
      <Link
        to="/dashboard"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-[0.98]"
      >
        <ShoppingBag size={16} />
        Start Shopping
      </Link>
    </motion.div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-16 text-center dark:border-red-900/30 dark:bg-red-500/10"
    >
      <AlertCircle size={36} className="mb-4 text-red-400" />
      <p className="font-semibold text-red-700 dark:text-red-400">
        Couldn't load orders
      </p>
      <p className="mt-1 text-sm text-red-500 dark:text-red-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 flex items-center gap-2 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { statusFilter, orderSearch } = useOutletContext<AppOutletCtx>();
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const orders = useOrdersStore((s) => s.orders);
  const loading = useOrdersStore((s) => s.loading);
  const error = useOrdersStore((s) => s.error);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const visibleOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSearch =
      !orderSearch.trim() ||
      String(o.id).includes(orderSearch.trim()) ||
      o.status.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.delivery_address?.name?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="mx-auto max-w-3xl px-5 pb-28 pt-6">
      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : visibleOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center text-sm text-gray-400 dark:text-gray-600"
        >
          No orders match your filters.
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {visibleOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}

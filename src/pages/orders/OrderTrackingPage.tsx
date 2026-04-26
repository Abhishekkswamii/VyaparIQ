import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, Clock, Package, Truck,
  MapPin, Star, Download, FileText, RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { formatINR } from "@/lib/format";
import type { OrderStatus } from "@/store/orders-store";

// ── Tracking steps in order ────────────────────────────────────────────────────

const STEPS: { status: OrderStatus; label: string; description: string; icon: React.ElementType }[] = [
  { status: "pending",          label: "Order Placed",       description: "Your order has been received",          icon: Clock        },
  { status: "confirmed",        label: "Order Confirmed",    description: "Seller confirmed your order",           icon: CheckCircle2 },
  { status: "processing",       label: "Being Prepared",     description: "Items are being packed",                icon: Package      },
  { status: "shipped",          label: "Shipped",            description: "Order is on the way",                   icon: Truck        },
  { status: "out_for_delivery", label: "Out for Delivery",   description: "Arriving today",                        icon: MapPin       },
  { status: "delivered",        label: "Delivered",          description: "Order delivered successfully",          icon: Star         },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending:          0,
  confirmed:        1,
  processing:       2,
  shipped:          3,
  out_for_delivery: 4,
  delivered:        5,
  cancelled:        -1,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderDetail {
  id: number;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  total_amount: string;
  payment_method: string;
  delivery_address: Record<string, string>;
  created_at: string;
  updated_at: string;
  items: { name: string; quantity: number; price: string; line_total: string }[];
  invoice_id: string | null;
  invoice_path: string | null;
}

export default function OrderTrackingPage() {
  const { id }    = useParams<{ id: string }>();
  const token     = useAuthStore((s) => s.token);
  const [order,   setOrder]   = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [dlLoading, setDlLoading] = useState(false);

  const fetchOrder = () => {
    if (!token || !id) return;
    setLoading(true); setError(null);
    fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setOrder(d.order))
      .catch(() => setError("Could not load order details."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id, token]);

  const handleDownload = async () => {
    if (!order || !token) return;
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

  if (loading) return (
    <main className="mx-auto max-w-2xl px-5 pt-10 pb-20">
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
    </main>
  );

  if (error || !order) return (
    <main className="mx-auto max-w-2xl px-5 pt-10 pb-20 text-center">
      <p className="text-gray-500">{error ?? "Order not found."}</p>
      <Link to="/orders" className="mt-4 inline-block text-orange-600 hover:underline">← Back to orders</Link>
    </main>
  );

  const currentIdx = STATUS_INDEX[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";
  const addr = order.delivery_address as Record<string, string>;

  const deliveryDate = new Date(order.created_at);
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryStr = deliveryDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-8">
      {/* Back + refresh */}
      <div className="mb-6 flex items-center justify-between">
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600">
          <ArrowLeft size={15} /> Back to Orders
        </Link>
        <button onClick={fetchOrder} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-600">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Order #{order.id}</h1>
        <p className="text-sm text-gray-500">
          Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="space-y-5">
        {/* Tracking timeline */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 font-bold text-gray-900 dark:text-white">
            {isCancelled ? "Order Cancelled" : `Estimated Delivery: ${deliveryStr}`}
          </h2>

          {isCancelled ? (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Package size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">This order was cancelled</p>
                <p className="text-xs text-red-500">No charges will be applied for COD orders</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {STEPS.map((step, idx) => {
                const isDone    = idx < currentIdx;
                const isActive  = idx === currentIdx;
                const isPending = idx > currentIdx;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex gap-4">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                        transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition
                          ${isDone   ? "border-green-500 bg-green-500"
                          : isActive ? "border-orange-500 bg-orange-500"
                          :            "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"}`}
                      >
                        <Icon size={15} className={isPending ? "text-gray-300 dark:text-gray-600" : "text-white"} />
                      </motion.div>
                      {idx < STEPS.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 ${isDone ? "bg-green-400" : "bg-gray-100 dark:bg-gray-800"}`} style={{ minHeight: "28px" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-6 ${idx === STEPS.length - 1 ? "pb-0" : ""}`}>
                      <p className={`font-semibold ${isPending ? "text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-white"}`}>
                        {step.label}
                        {isActive && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-900/30">Current</span>}
                      </p>
                      <p className={`text-xs mt-0.5 ${isPending ? "text-gray-300 dark:text-gray-700" : "text-gray-500"}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 font-bold text-gray-900 dark:text-white">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.name} <span className="text-gray-400">× {item.quantity}</span>
                </span>
                <span className="font-semibold">{formatINR(parseFloat(item.line_total))}</span>
              </div>
            ))}
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
            <div className="flex items-center justify-between font-bold">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-orange-600">{formatINR(parseFloat(order.total_amount))}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} className="text-orange-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Delivery Address</h2>
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">{addr.name}</p>
          <p className="text-sm text-gray-500">{addr.phone}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {[addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          {order.invoice_id && (
            <button
              onClick={handleDownload}
              disabled={dlLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-bold text-orange-700 hover:bg-orange-100 transition-all disabled:opacity-60 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
            >
              <Download size={14} />
              {dlLoading ? "Downloading…" : "Download Invoice"}
            </button>
          )}
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <FileText size={14} /> My Orders
          </Link>
        </div>
      </div>
    </main>
  );
}

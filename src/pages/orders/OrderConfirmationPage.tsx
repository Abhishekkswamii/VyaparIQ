import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, Package, ShoppingBag, MapPin, Navigation,
  FileText, Download, Banknote, Clock, Loader2, Star,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { formatINR } from "@/lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  name: string;
  category: string | null;
  price: string;
  quantity: number;
  line_total: string;
}

interface DeliveryAddress {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface OrderDetail {
  id: number;
  status: string;
  subtotal: string;
  discount: string;
  total_amount: string;
  payment_method: string;
  delivery_address: DeliveryAddress;
  created_at: string;
  items: OrderItem[];
  invoice_id: string | null;
  invoice_path: string | null;
}

interface RouteState {
  total?: number;
  itemCount?: number;
  items?: { name: string; quantity: number; price: number }[];
  address?: DeliveryAddress;
  paymentMethod?: string;
  invoiceId?: string | null;
  hasInvoice?: boolean;
}

// ── Status display ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:          "Pending Confirmation",
  confirmed:        "Order Confirmed",
  processing:       "Being Prepared",
  shipped:          "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const { id }   = useParams<{ id: string }>();
  const location = useLocation();
  const token    = useAuthStore((s) => s.token);

  const routeState = (location.state as RouteState) ?? {};

  const [order,      setOrder]      = useState<OrderDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [dlLoading,  setDlLoading]  = useState(false);

  // Fetch from API (works on hard refresh too)
  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }
    fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: { order: OrderDetail }) => setOrder(d.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleDownload = async () => {
    if (!token || !id) return;
    setDlLoading(true);
    try {
      const r    = await fetch(`/api/invoices/${id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error("not found");
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const fname = order?.invoice_id ?? routeState.invoiceId ?? `invoice-${id}`;
      // fname is used below for the download filename
      a.href = url; a.download = `${fname}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally { setDlLoading(false); }
  };

  // Prefer API data; fall back to route state while loading
  const displayItems   = order?.items ?? routeState.items?.map((i, idx) => ({
    id: idx, name: i.name, category: null,
    price: String(i.price), quantity: i.quantity,
    line_total: String(i.price * i.quantity),
  })) ?? [];

  const displayAddr    = order?.delivery_address ?? routeState.address ?? {};
  const displayTotal   = order ? parseFloat(order.total_amount) : (routeState.total ?? 0);
  const displaySubtotal = order ? parseFloat(order.subtotal) : displayTotal;
  const displayDiscount = order ? parseFloat(order.discount) : 0;
  const displayStatus  = order?.status ?? "pending";
  const hasInvoice     = !!(order?.invoice_id ?? routeState.hasInvoice);
  const payMethod      = order?.payment_method ?? routeState.paymentMethod ?? "cod";

  const orderDate = order
    ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const deliveryDate = new Date(order?.created_at ?? Date.now());
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryStr = deliveryDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  if (loading) return (
    <main className="mx-auto max-w-2xl px-5 pt-10 pb-20 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </main>
  );

  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">

      {/* ── Success banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="mb-7 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-800/40 dark:bg-green-900/20"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-500/30"
          >
            <CheckCircle2 size={28} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Order #{id} &middot; {orderDate}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">

        {/* ── Delivery estimate + status ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-blue-500" />
            <h2 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Estimated Delivery</h2>
          </div>
          <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{deliveryStr}</p>
          <p className="mt-1 text-sm text-gray-500">Free delivery &middot; Cash on Delivery</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
            <Package size={14} />
            {STATUS_LABEL[displayStatus] ?? "Pending"}
          </div>
        </motion.div>

        {/* ── Items ordered ───────────────────────────────────────────────── */}
        {displayItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="mb-4 font-bold text-gray-900 dark:text-white">Items Ordered</h2>
            <div className="space-y-3">
              {displayItems.map((item, i) => (
                <div key={item.id ?? i} className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20">
                      <Package size={14} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
                      {item.category && <p className="text-xs text-gray-400">{item.category}</p>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatINR(parseFloat(String(item.line_total)))}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatINR(parseFloat(String(item.price)))} &times; {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatINR(displaySubtotal)}</span>
              </div>
              {displayDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatINR(displayDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-green-600">
                <span>Delivery</span>
                <span className="font-semibold">FREE</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
                <span className="font-extrabold text-gray-900 dark:text-white">Total</span>
                <span className="text-lg font-extrabold text-orange-600">{formatINR(displayTotal)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
              <Banknote size={14} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment: <span className="font-semibold">{payMethod === "cod" ? "Cash on Delivery" : payMethod}</span>
              </span>
            </div>
          </motion.div>
        )}

        {/* ── Shipping address ────────────────────────────────────────────── */}
        {(displayAddr.name || displayAddr.address) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-orange-600" />
              <h2 className="font-bold text-gray-900 dark:text-white">Shipping Address</h2>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{displayAddr.name}</p>
            {displayAddr.phone && <p className="text-sm text-gray-500 mt-0.5">{displayAddr.phone}</p>}
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {[displayAddr.address, displayAddr.city, displayAddr.state, displayAddr.pincode]
                .filter(Boolean).join(", ")}
            </p>
          </motion.div>
        )}

        {/* ── Action buttons ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Track order */}
          <Link
            to={`/orders/${id}/track`}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.98] transition-all"
          >
            <Navigation size={15} />
            Track Order
          </Link>

          {/* Download invoice */}
          {hasInvoice ? (
            <button
              onClick={handleDownload}
              disabled={dlLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3.5 text-sm font-bold text-orange-700 hover:bg-orange-100 active:scale-[0.98] transition-all disabled:opacity-60 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
            >
              {dlLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {dlLoading ? "Downloading…" : "Download Invoice"}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-3.5 text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900">
              <FileText size={15} />
              Invoice Generating…
            </div>
          )}

          {/* My orders */}
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <FileText size={15} />
            My Orders
          </Link>

          {/* Continue shopping */}
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <ShoppingBag size={15} />
            Continue Shopping
          </Link>
        </motion.div>

        {/* ── What happens next ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="mb-4 font-bold text-gray-900 dark:text-white">What happens next?</h2>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, color: "text-green-500", label: "Order confirmed", desc: "We've received your order" },
              { icon: Package,      color: "text-blue-500",  label: "Packing",         desc: "Your items are being packed" },
              { icon: Navigation,   color: "text-purple-500",label: "Out for delivery", desc: `Expected by ${deliveryStr}` },
              { icon: Star,         color: "text-orange-500",label: "Delivered",        desc: "Pay on delivery" },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={16} className={color} />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </main>
  );
}

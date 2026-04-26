import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, Package, ShoppingBag, MapPin,
  FileText, Download, Navigation, Banknote, Clock,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { formatINR } from "@/lib/format";

interface SuccessItem { name: string; quantity: number; price: number; }
interface SuccessAddress { name?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string; }

interface OrderSuccessState {
  orderId?: number;
  total?: number;
  itemCount?: number;
  items?: SuccessItem[];
  address?: SuccessAddress;
  paymentMethod?: string;
  invoiceId?: string;
  hasInvoice?: boolean;
}

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const token     = useAuthStore((s) => s.token);

  const {
    orderId, total, itemCount, items = [], address,
    invoiceId, hasInvoice,
  } = (state as OrderSuccessState) ?? {};

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryStr = deliveryDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const handleDownload = () => {
    if (!orderId || !token) return;
    const a = document.createElement("a");
    a.href = `/api/invoices/${orderId}/download`;
    (a as HTMLAnchorElement & { authorization?: string });
    fetch(`/api/invoices/${orderId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.blob()).then((blob) => {
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${invoiceId || `invoice-${orderId}`}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-10">
      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-900/20"
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-500/30"
        >
          <CheckCircle2 size={28} className="text-white" />
        </motion.div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Order Placed Successfully! 🎉</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {orderId ? `Order #${orderId} · ` : ""}Your order has been received and is being processed.
          </p>
        </div>
      </motion.div>

      <div className="space-y-5">
        {/* Delivery estimate */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock size={16} className="text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">Estimated Delivery</h2>
          </div>
          <p className="text-2xl font-extrabold text-orange-600">{deliveryStr}</p>
          <p className="mt-1 text-sm text-gray-500">Free delivery · Cash on Delivery</p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
            <Package size={14} />
            Status: <span className="capitalize ml-1">Pending confirmation</span>
          </div>
        </motion.div>

        {/* Items + price summary */}
        {(items.length > 0 || total !== undefined) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="mb-4 font-bold text-gray-900 dark:text-white">Order Summary</h2>
            {items.length > 0 && (
              <div className="mb-4 space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.name} <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold">{formatINR(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white">
                Total ({itemCount ?? items.length} {(itemCount ?? items.length) === 1 ? "item" : "items"})
              </span>
              <span className="text-xl font-extrabold text-orange-600">
                {total !== undefined ? formatINR(total) : "—"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
              <Banknote size={12} className="text-green-600" />
              Payment: Cash on Delivery
            </div>
          </motion.div>
        )}

        {/* Shipping address */}
        {address && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <MapPin size={16} className="text-orange-600" />
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white">Shipping Address</h2>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{address.name}</p>
            <p className="text-sm text-gray-500">{address.phone}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {[address.address, address.city, address.state, address.pincode].filter(Boolean).join(", ")}
            </p>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
          className="grid grid-cols-2 gap-3"
        >
          {orderId && (
            <button
              onClick={() => navigate(`/orders/${orderId}/track`)}
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 hover:bg-orange-700 active:scale-[0.98] transition-all"
            >
              <Navigation size={15} />
              Track Order
            </button>
          )}

          {hasInvoice && orderId && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3.5 text-sm font-bold text-orange-700 hover:bg-orange-100 active:scale-[0.98] transition-all dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
            >
              <Download size={15} />
              Download Invoice
            </button>
          )}

          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <FileText size={15} />
            My Orders
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <ShoppingBag size={15} />
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

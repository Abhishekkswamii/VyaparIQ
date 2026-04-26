import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, ShoppingBag, TrendingUp, ArrowRight,
  RefreshCw, AlertTriangle, Clock, FileText, Wifi, WifiOff,
} from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { useAuthStore } from "@/store/auth-store";
import { formatINR } from "@/lib/format";
import { APP_NAME } from "@/constants/branding";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, loading,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-800" />
      ) : (
        <p className="text-2xl font-extrabold text-white">{value}</p>
      )}
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const fetchStats  = useAdminStore((s) => s.fetchStats);
  const stats       = useAdminStore((s) => s.stats);
  const statsLoading = useAdminStore((s) => s.statsLoading);
  const fetchAdminOrders = useAdminStore((s) => s.fetchAdminOrders);
  const fetchAdminInvoices = useAdminStore((s) => s.fetchAdminInvoices);
  const token = useAuthStore((s) => s.token);

  const [liveStatus, setLiveStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [lastEvent,  setLastEvent]  = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
    fetchAdminOrders(10);
    fetchAdminInvoices();
  }, []);

  // ── SSE listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const es = new EventSource(`/api/admin/events?token=${token}`);
    esRef.current = es;

    es.addEventListener("connected", () => setLiveStatus("live"));
    es.addEventListener("new_order", () => {
      setLastEvent("New order received");
      fetchStats(); fetchAdminOrders(10);
    });
    es.addEventListener("order_update", () => {
      setLastEvent("Order status updated");
      fetchStats();
    });
    es.addEventListener("stock_update", () => {
      setLastEvent("Stock updated");
      fetchStats();
    });
    es.addEventListener("invoice_ready", () => {
      setLastEvent("Invoice generated");
      fetchAdminInvoices();
    });
    es.onerror = () => setLiveStatus("offline");

    return () => { es.close(); esRef.current = null; };
  }, [token]);

  // ── 30s polling fallback ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => { fetchStats(); fetchAdminOrders(10); }, 30_000);
    return () => clearInterval(id);
  }, []);

  const s = stats;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{APP_NAME} Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">Platform overview — auto-refreshes every 30s</p>
        </div>
        <div className="flex items-center gap-3">
          {/* SSE status */}
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            liveStatus === "live"
              ? "border-green-800 bg-green-500/10 text-green-400"
              : liveStatus === "offline"
              ? "border-red-800 bg-red-500/10 text-red-400"
              : "border-gray-700 bg-gray-800 text-gray-400"
          }`}>
            {liveStatus === "live" ? <Wifi size={11} /> : <WifiOff size={11} />}
            {liveStatus === "live" ? "Live" : liveStatus === "offline" ? "Offline" : "Connecting…"}
          </div>
          <button
            onClick={() => { fetchStats(); fetchAdminOrders(10); fetchAdminInvoices(); }}
            disabled={statsLoading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3.5 py-1.5 text-xs text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
          >
            <RefreshCw size={12} className={statsLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {lastEvent && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-orange-800/40 bg-orange-500/10 px-4 py-2.5 text-xs font-semibold text-orange-400">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
          {lastEvent}
        </div>
      )}

      {/* ── Revenue row ───────────────────────────────────────────────────── */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue"   value={s ? formatINR(s.totalRevenue) : "₹0"} icon={TrendingUp}  color="bg-green-600"  loading={statsLoading} />
        <StatCard label="Today Revenue"   value={s ? formatINR(s.todayRevenue) : "₹0"} sub={s ? `${s.todayOrders} orders today` : undefined} icon={TrendingUp} color="bg-emerald-500" loading={statsLoading} />
        <StatCard label="Avg Order Value" value={s ? formatINR(s.avgOrderValue) : "₹0"} icon={ShoppingBag} color="bg-violet-600" loading={statsLoading} />
        <StatCard label="Total Orders"    value={s?.totalOrders ?? 0}  icon={Package}     color="bg-blue-600"   loading={statsLoading} />
      </div>

      {/* ── Operations row ────────────────────────────────────────────────── */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Orders"   value={s?.pendingOrders   ?? 0} icon={Clock}          color="bg-yellow-600"  loading={statsLoading} />
        <StatCard label="Delivered Orders" value={s?.deliveredOrders ?? 0} icon={Package}         color="bg-green-700"   loading={statsLoading} />
        <StatCard label="Cancelled"        value={s?.cancelledOrders ?? 0} icon={AlertTriangle}   color="bg-red-700"     loading={statsLoading} />
        <StatCard label="Low Stock Items"  value={s?.lowStockCount   ?? 0} sub="≤5 units" icon={AlertTriangle} color="bg-orange-600" loading={statsLoading} />
      </div>

      {/* ── Quick nav ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Quick Navigation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { to: "/admin/products",  icon: Package,     color: "text-orange-400", label: "Products",  desc: "Add, edit, delete products" },
            { to: "/admin/orders",    icon: ShoppingBag, color: "text-violet-400", label: "Orders",    desc: "Manage & update order status" },
            { to: "/admin/inventory", icon: AlertTriangle, color: "text-yellow-400", label: "Inventory", desc: "Stock levels & low-stock alerts" },
            { to: "/admin/invoices",  icon: FileText,    color: "text-blue-400",   label: "Invoices",  desc: "View & download invoices" },
          ].map(({ to, icon: Icon, color, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3.5 transition-all hover:border-orange-500/60 hover:bg-orange-500/10"
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className={color} />
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-gray-600 transition-colors group-hover:text-orange-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

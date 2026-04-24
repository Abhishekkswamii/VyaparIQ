import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Users, ShoppingBag, TrendingUp, ArrowRight } from "lucide-react";
import { useAdminStore } from "@/store/admin-store";
import { formatINR } from "@/lib/format";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-800" />
      ) : (
        <p className="text-3xl font-extrabold text-white">{value}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const fetchStats = useAdminStore((s) => s.fetchStats);
  const stats = useAdminStore((s) => s.stats);
  const statsLoading = useAdminStore((s) => s.statsLoading);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">
          VyaparIQ platform overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="bg-orange-500"
          loading={statsLoading}
        />
        <StatCard
          label="Registered Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          color="bg-blue-500"
          loading={statsLoading}
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingBag}
          color="bg-violet-500"
          loading={statsLoading}
        />
        <StatCard
          label="Total Revenue"
          value={stats ? formatINR(stats.totalRevenue) : "₹0"}
          icon={TrendingUp}
          color="bg-green-500"
          loading={statsLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/admin/products"
            className="group flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3.5 transition-all hover:border-orange-500/60 hover:bg-orange-500/10"
          >
            <div className="flex items-center gap-3">
              <Package size={18} className="text-orange-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Manage Products
                </p>
                <p className="text-xs text-gray-500">Add, edit, delete products</p>
              </div>
            </div>
            <ArrowRight
              size={16}
              className="text-gray-600 transition-colors group-hover:text-orange-400"
            />
          </Link>

          <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3.5 opacity-50">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-white">Manage Users</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-600" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3.5 opacity-50">
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className="text-violet-400" />
              <div>
                <p className="text-sm font-semibold text-white">View Orders</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-600" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/60 px-4 py-3.5 opacity-50">
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-green-400" />
              <div>
                <p className="text-sm font-semibold text-white">Analytics</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

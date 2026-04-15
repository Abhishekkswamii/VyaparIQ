import { motion } from "framer-motion";
import { TrendingUp, DollarSign, ShoppingBag, BarChart3, TrendingDown } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";

const weeklyData = [
  { day: "Mon", amount: 12.5 },
  { day: "Tue", amount: 28.99 },
  { day: "Wed", amount: 8.75 },
  { day: "Thu", amount: 35.2 },
  { day: "Fri", amount: 22.45 },
  { day: "Sat", amount: 48.3 },
  { day: "Sun", amount: 15.6 },
];

const monthlyData = [
  { month: "Nov", amount: 128 },
  { month: "Dec", amount: 194 },
  { month: "Jan", amount: 142 },
  { month: "Feb", amount: 118 },
  { month: "Mar", amount: 175 },
  { month: "Apr", amount: 201 },
];

const categoryMock = [
  { name: "Fruits & Veg", amount: 45.2, pct: 28, color: "bg-green-500" },
  { name: "Dairy", amount: 38.5, pct: 24, color: "bg-blue-500" },
  { name: "Meat & Fish", amount: 52.8, pct: 33, color: "bg-red-500" },
  { name: "Bakery", amount: 18.9, pct: 12, color: "bg-amber-500" },
  { name: "Pantry", amount: 6.2, pct: 3, color: "bg-purple-500" },
];

const recentOrders = [
  { id: "#ORD-2025-041", date: "Today, 2:30 PM", items: 4, total: 24.5, status: "Delivered" },
  { id: "#ORD-2025-040", date: "Yesterday, 11:00 AM", items: 2, total: 12.99, status: "Delivered" },
  { id: "#ORD-2025-038", date: "Apr 12, 9:15 AM", items: 7, total: 48.3, status: "Delivered" },
  { id: "#ORD-2025-035", date: "Apr 10, 4:45 PM", items: 3, total: 18.75, status: "Delivered" },
  { id: "#ORD-2025-030", date: "Apr 8, 1:20 PM", items: 5, total: 34.6, status: "Delivered" },
];

function BarChart({
  data,
  barColor = "bg-orange-500",
  maxBarPx = 100,
}: {
  data: { label: string; amount: number }[];
  barColor?: string;
  maxBarPx?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.amount));
  return (
    <div className="flex items-end justify-between gap-1.5 sm:gap-2" style={{ height: maxBarPx + 48 }}>
      {data.map(({ label, amount }, i) => {
        const barH = Math.max(4, Math.round((amount / maxVal) * maxBarPx));
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="hidden text-[10px] font-semibold text-gray-500 sm:block dark:text-gray-400">
              ₹{Math.round(amount)}
            </span>
            <div className="flex w-full items-end" style={{ height: maxBarPx }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barH }}
                transition={{ duration: 0.65, delay: i * 0.06, ease: "easeOut" }}
                className={`w-full rounded-t-lg ${barColor}`}
              />
            </div>
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MiniDonut({ segments }: { segments: { pct: number; color: string }[] }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const colors: Record<string, string> = {
    "bg-green-500": "#22c55e",
    "bg-blue-500": "#3b82f6",
    "bg-red-500": "#ef4444",
    "bg-amber-500": "#f59e0b",
    "bg-purple-500": "#a855f7",
  };
  return (
    <svg width="120" height="120" className="-rotate-90">
      <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" className="stroke-gray-100 dark:stroke-gray-800" />
      {segments.map(({ pct, color }, i) => {
        const dash = (pct / 100) * C;
        const gap = C - dash;
        const seg = (
          <circle
            key={i}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="14"
            stroke={colors[color] ?? "#f97316"}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return seg;
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const totalPrice = useCartStore((s) => s.totalPrice);
  const budget = useBudgetStore((s) => s.budget);

  const currentSpend = totalPrice();
  const weeklyTotal = weeklyData.reduce((s, d) => s + d.amount, 0);
  const monthlyTotal = monthlyData.reduce((s, d) => s + d.amount, 0);

  const statCards = [
    {
      label: "This Week",
      value: `₹${weeklyTotal.toFixed(0)}`,
      icon: DollarSign,
      delta: "+12%",
      positive: true,
      bg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "This Month",
      value: `₹${monthlyTotal.toFixed(0)}`,
      icon: TrendingUp,
      delta: "+8%",
      positive: true,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Orders",
      value: "24",
      icon: ShoppingBag,
      delta: "+3 this week",
      positive: true,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Avg. Order",
      value: "₹37.21",
      icon: BarChart3,
      delta: "-2%",
      positive: false,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  const weekFormatted = weeklyData.map((d) => ({ label: d.day, amount: d.amount }));
  const monthFormatted = monthlyData.map((d) => ({ label: d.month, amount: d.amount }));
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-28 pt-8 dark:bg-gray-950">
      <div className="mb-6">
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Insights into your shopping habits and spending patterns
        </p>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`rounded-lg p-2 ${s.bg}`}>
                <s.icon size={16} className={s.iconColor} />
              </div>
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold ${
                  s.positive ? "text-orange-600" : "text-red-500"
                }`}
              >
                {s.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {s.delta}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="mb-5 grid gap-5 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Weekly Spending</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">Apr 7 – Apr 13, 2025</p>
            </div>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">
              ₹{weeklyTotal.toFixed(2)} total
            </span>
          </div>
          <BarChart data={weekFormatted} barColor="bg-orange-500" maxBarPx={96} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-gray-800 dark:bg-gray-900"
        >
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">Category Split</h3>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <MiniDonut segments={categoryMock.map((c) => ({ pct: c.pct, color: c.color }))} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {categoryMock.map(({ name, pct, color }) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                  <span className="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-400">{name}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Monthly trend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Monthly Trend</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Last 6 months</p>
          </div>
          {budget > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Budget: ₹{budget.toFixed(0)}/mo
            </span>
          )}
        </div>
        <BarChart data={monthFormatted} barColor="bg-violet-500" maxBarPx={110} />
      </motion.div>

      {/* Category breakdown bars */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <h3 className="mb-5 text-sm font-bold text-gray-800 dark:text-gray-100">Spending by Category</h3>
        <div className="space-y-4">
          {categoryMock.map(({ name, amount, pct, color }, i) => (
            <div key={name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-100">
                  ₹{amount.toFixed(2)}{" "}
                  <span className="font-normal text-gray-400 dark:text-gray-500">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
                  className={`h-full rounded-full ${color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Order history */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Order History</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-orange-50 dark:hover:bg-gray-800"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
                <ShoppingBag size={16} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{order.id}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {order.date} &middot; {order.items} items
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">₹{order.total.toFixed(2)}</p>
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Current session */}
      {currentSpend > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800/40 dark:bg-orange-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Current Session</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Cart value right now</p>
            </div>
            <p className="text-2xl font-extrabold text-orange-700 dark:text-orange-400">₹{currentSpend.toFixed(2)}</p>
          </div>
        </motion.div>
      )}
    </main>
  );
}

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  BarChart3,
  X,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from "recharts";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { formatINR } from "@/lib/format";

/* ── colour maps ─────────────────────────────────────────── */
const CAT_COLORS: Record<string, string> = {
  Fruits: "#22c55e", Dairy: "#3b82f6", Bakery: "#f59e0b",
  Meat: "#ef4444", Grains: "#eab308", Pantry: "#a855f7",
  Vegetables: "#10b981", Beverages: "#0ea5e9",
};
const FALLBACK_CLR = "#9ca3af";

/* ── mock session history (replaced by API later in 2C) ─── */
const mockSessions = [
  { id: "s7", date: "Apr 20", items: 6, total: 524, budget: 800, pctUsed: 65.5 },
  { id: "s6", date: "Apr 18", items: 4, total: 340, budget: 500, pctUsed: 68 },
  { id: "s5", date: "Apr 15", items: 8, total: 890, budget: 1000, pctUsed: 89 },
  { id: "s4", date: "Apr 12", items: 3, total: 210, budget: 600, pctUsed: 35 },
  { id: "s3", date: "Apr 10", items: 5, total: 460, budget: 500, pctUsed: 92 },
  { id: "s2", date: "Apr 7", items: 7, total: 630, budget: 700, pctUsed: 90 },
  { id: "s1", date: "Apr 4", items: 2, total: 175, budget: 400, pctUsed: 43.8 },
];

/* ── custom tooltip ───────────────────────────────────────── */
function CatTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="font-semibold text-gray-900 dark:text-white">{d.name}</p>
      <p className="text-gray-500">{formatINR(d.value)}</p>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────── */
export default function AnalyticsPage() {
  const items     = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const budget    = useBudgetStore((s) => s.budget);

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessions, setSessions] = useState(mockSessions);
  const [sortAsc, setSortAsc] = useState(false);

  // Try fetching real sessions (falls back to mock)
  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { sessions?: typeof mockSessions }) => {
        if (data.sessions?.length) setSessions(data.sessions);
      })
      .catch(() => { /* use mock */ });
  }, []);

  const spent = totalPrice();

  /* ── category pie data ─ */
  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => {
      map[i.category] = (map[i.category] ?? 0) + i.price * i.quantity;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, fill: CAT_COLORS[name] ?? FALLBACK_CLR }));
  }, [items]);

  const catTotal = catData.reduce((s, d) => s + d.value, 0);

  /* ── item frequency ─ */
  const topItems = useMemo(() => {
    const freq: Record<string, { name: string; count: number }> = {};
    items.forEach((i) => {
      freq[i.id] = { name: i.name, count: (freq[i.id]?.count ?? 0) + i.quantity };
    });
    return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [items]);

  /* ── spending trend from sessions ─ */
  const trendData = useMemo(
    () => [...sessions].reverse().map((s) => ({ name: s.date, spend: s.total, budget: s.budget })),
    [sessions]
  );

  /* ── category comparison badges (vs last session) ─ */
  // simplified: compare current category totals against the mock percentages
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) =>
        sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
      ),
    [sessions, sortAsc]
  );

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  const weeklyTotal = sessions.slice(0, 3).reduce((s, d) => s + d.total, 0);
  const monthlyTotal = sessions.reduce((s, d) => s + d.total, 0);

  const statCards = [
    { label: "This Week",   value: formatINR(weeklyTotal),  icon: DollarSign,  delta: "+12%", positive: true,  bg: "bg-orange-50 dark:bg-orange-900/20", iconColor: "text-orange-600 dark:text-orange-400" },
    { label: "This Month",  value: formatINR(monthlyTotal), icon: TrendingUp,  delta: "+8%",  positive: true,  bg: "bg-blue-50 dark:bg-blue-900/20",     iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "Sessions",    value: String(sessions.length),  icon: ShoppingBag, delta: `${sessions.length} total`, positive: true,  bg: "bg-violet-50 dark:bg-violet-900/20", iconColor: "text-violet-600 dark:text-violet-400" },
    { label: "Avg. Session", value: formatINR(sessions.length ? monthlyTotal / sessions.length : 0), icon: BarChart3, delta: sessions.length > 1 ? "-2%" : "—", positive: false, bg: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 pb-28 pt-8 dark:bg-gray-950">
      <div className="mb-6">
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Insights into your shopping habits and spending patterns
        </p>
      </div>

      {/* ── stat cards ── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <div className={`rounded-lg p-2 ${s.bg}`}><s.icon size={16} className={s.iconColor} /></div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${s.positive ? "text-green-600" : "text-red-500"}`}>
                {s.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{s.delta}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── charts row ── */}
      <div className="mb-5 grid gap-5 lg:grid-cols-5">
        {/* Category Pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">Category Breakdown</h3>
          {catData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Add items to see breakdown</p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none" animationDuration={800} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {catData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<CatTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {catData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                    {d.name} — {formatINR(d.value)} ({catTotal ? Math.round((d.value / catTotal) * 100) : 0}%)
                  </span>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Spending Trend Line */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Spending Trend</h3>
              <p className="text-xs text-gray-400">Last {sessions.length} sessions</p>
            </div>
            {budget > 0 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Budget: {formatINR(budget)}
              </span>
            )}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: 4, right: 4, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${v}`} />
                <Tooltip formatter={(v) => formatINR(Number(v))} />
                <Line type="monotone" dataKey="spend" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} animationDuration={800} />
                {budget > 0 && <ReferenceLine y={budget} stroke="#ef4444" strokeDasharray="6 4" label={{ value: "Budget", position: "right", fontSize: 10 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── items you buy often ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mb-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-bold text-gray-800 dark:text-gray-100">Items You Buy Often</h3>
        {topItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No items in cart yet</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {topItems.map((it) => (
              <div key={it.name} className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{it.name}</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  x{it.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── session history table ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Session History</h3>
          <button onClick={() => setSortAsc(!sortAsc)} className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400">
            Sort {sortAsc ? "↓ newest" : "↑ oldest"}
          </button>
        </div>
        {/* header */}
        <div className="hidden items-center gap-4 border-b border-gray-100 px-6 py-2.5 text-xs font-semibold text-gray-500 sm:flex dark:border-gray-800 dark:text-gray-400">
          <span className="w-24">Date</span>
          <span className="w-16 text-center">Items</span>
          <span className="flex-1">Total Spent</span>
          <span className="w-24">Budget</span>
          <span className="w-20 text-right">% Used</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {sortedSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSession(selectedSession === s.id ? null : s.id)}
              className="flex w-full items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-orange-50 dark:hover:bg-gray-800"
            >
              <span className="w-24 text-sm font-medium text-gray-800 dark:text-gray-200">{s.date}</span>
              <span className="w-16 text-center text-sm text-gray-500 dark:text-gray-400">{s.items}</span>
              <span className="flex-1 text-sm font-bold text-gray-800 dark:text-gray-100">{formatINR(s.total)}</span>
              <span className="w-24 text-sm text-gray-500 dark:text-gray-400">{formatINR(s.budget)}</span>
              <span className={`w-20 text-right text-sm font-bold ${s.pctUsed > 90 ? "text-red-500" : s.pctUsed > 70 ? "text-amber-500" : "text-green-600"}`}>
                {Math.round(s.pctUsed)}%
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── session detail modal ── */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Session Detail</h3>
                <button onClick={() => setSelectedSession(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button>
              </div>
              {(() => {
                const s = sessions.find((x) => x.id === selectedSession);
                if (!s) return null;
                return (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-900 dark:text-white">{s.date}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Items</span><span className="font-semibold text-gray-900 dark:text-white">{s.items}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Spent</span><span className="font-semibold text-gray-900 dark:text-white">{formatINR(s.total)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Budget</span><span className="font-semibold text-gray-900 dark:text-white">{formatINR(s.budget)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">% Used</span><span className={`font-bold ${s.pctUsed > 90 ? "text-red-500" : "text-green-600"}`}>{Math.round(s.pctUsed)}%</span></div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── current session banner ── */}
      {spent > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800/40 dark:bg-orange-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Current Session</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Cart value right now</p>
            </div>
            <p className="text-2xl font-extrabold text-orange-700 dark:text-orange-400">{formatINR(spent)}</p>
          </div>
        </motion.div>
      )}
    </main>
  );
}

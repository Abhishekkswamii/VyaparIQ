import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Target,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";
import { formatINR } from "@/lib/format";

const CATEGORY_HEX: Record<string, string> = {
  Fruits: "#22c55e",
  Dairy: "#3b82f6",
  Bakery: "#f59e0b",
  Meat: "#ef4444",
  Grains: "#eab308",
  Pantry: "#a855f7",
  Vegetables: "#10b981",
  Beverages: "#0ea5e9",
};
const DEFAULT_HEX = "#9ca3af";

const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  Fruits:     { bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-700 dark:text-green-400" },
  Dairy:      { bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-700 dark:text-blue-400"  },
  Bakery:     { bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-700 dark:text-amber-400"},
  Meat:       { bg: "bg-red-50 dark:bg-red-900/20",      text: "text-red-700 dark:text-red-400"    },
  Grains:     { bg: "bg-yellow-50 dark:bg-yellow-900/20",text: "text-yellow-700 dark:text-yellow-400"},
  Pantry:     { bg: "bg-purple-50 dark:bg-purple-900/20",text: "text-purple-700 dark:text-purple-400"},
  Vegetables: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400"},
  Beverages:  { bg: "bg-sky-50 dark:bg-sky-900/20",      text: "text-sky-700 dark:text-sky-400"},
};
const DEFAULT_BADGE = { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" };

/* ── Recharts Donut ──────────────────────────────────────── */
function BudgetDonut({ pct, isOver }: { pct: number; isOver: boolean }) {
  const clamped = Math.min(pct, 100);
  const fillColor = isOver ? "#ef4444" : pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e";
  const data = [
    { name: "Used", value: clamped },
    { name: "Free", value: 100 - clamped },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            animationDuration={900}
          >
            <Cell fill={fillColor} />
            <Cell fill="#f3f4f6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute text-center">
        <p className="text-3xl font-black leading-none" style={{ color: fillColor }}>
          {Math.round(pct)}%
        </p>
        <p className="mt-0.5 text-xs font-medium text-gray-400">used</p>
      </div>
    </div>
  );
}

/* ── Recharts Category Bar Tooltip ───────────────────────── */
function CategoryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; amount: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="font-semibold text-gray-900 dark:text-white">{d.name}</p>
      <p className="text-gray-500 dark:text-gray-400">{formatINR(d.amount)}</p>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export default function DashboardPage() {
  const items      = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const budget     = useBudgetStore((s) => s.budget);
  const setBudget  = useBudgetStore((s) => s.setBudget);
  const clearBudget = useBudgetStore((s) => s.clearBudget);

  const [inputVal, setInputVal]     = useState(budget > 0 ? String(budget) : "");
  const [editing, setEditing]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const spent      = totalPrice();
  const hasBudget  = budget > 0;
  const remaining  = hasBudget ? budget - spent : 0;
  const pct        = hasBudget ? (spent / budget) * 100 : 0;
  const isOver     = hasBudget && spent > budget;

  const categoryMap = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.price * item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const barData = categories.map(([cat, amount]) => ({
    name: cat,
    amount,
    fill: CATEGORY_HEX[cat] ?? DEFAULT_HEX,
  }));

  const saveBudget = () => {
    const v = parseFloat(inputVal);
    if (!isNaN(v) && v > 0) { setBudget(v); setEditing(false); }
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0  },
  };

  /* ── No budget set ── */
  if (!hasBudget && !editing) {
    return (
      <main className="mx-auto max-w-lg px-5 py-20 dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
            🎯
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Set Your Budget
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Define a shopping limit and track your spend in real‑time.
          </p>
          <div className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                ₹
              </span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-8 pr-4 text-base font-semibold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <button
              onClick={saveBudget}
              className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-600/25 transition-all hover:bg-orange-700 active:scale-95"
            >
              Set
            </button>
          </div>
          {items.length > 0 && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
              You already have {formatINR(spent)} in your cart.
            </p>
          )}
          <Link
            to="/shop"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600"
          >
            Browse products <ArrowRight size={14} />
          </Link>
        </motion.div>
      </main>
    );
  }

  /* ── Progress bar color ── */
  const progressColor = isOver
    ? "bg-red-500"
    : pct > 90
    ? "bg-red-500"
    : pct > 70
    ? "bg-amber-400"
    : "bg-green-500";

  /* ── Stat cards data ── */
  const stats = [
    {
      label: "Total Budget",
      value: formatINR(budget),
      icon: Target,
      cls: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      label: "Amount Spent",
      value: formatINR(spent),
      icon: ShoppingBag,
      cls: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    },
    {
      label: isOver ? "Over Budget" : "Remaining",
      value: isOver ? `+${formatINR(spent - budget)}` : formatINR(remaining),
      icon: isOver ? AlertTriangle : Wallet,
      cls: isOver
        ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        : "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
    },
    {
      label: "Budget Used",
      value: `${Math.min(Math.round(pct), 999)}%`,
      icon: TrendingUp,
      cls: isOver
        ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        : pct > 70
        ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 pb-28 pt-8 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Budget Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real‑time spending tracker
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isOver
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : pct > 70
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            }`}
          >
            {isOver ? `Over ${formatINR(spent - budget)}` : `${formatINR(remaining)} left`}
          </span>
          <button
            onClick={() => { setEditing(true); setInputVal(String(budget)); }}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
          >
            <RefreshCw size={14} /> Edit Budget
          </button>
          <button
            onClick={() => { clearBudget(); setInputVal(""); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-900/20"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Inline edit budget ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3.5 dark:border-orange-800/40 dark:bg-orange-500/10"
          >
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-8 pr-4 font-semibold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button onClick={saveBudget} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">Save</button>
            <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Over budget alert ── */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3.5 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          >
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-sm font-semibold">
              You're over budget by {formatINR(spent - budget)}. Consider removing some items.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat cards ── */}
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className={`mb-3 inline-flex rounded-lg p-2.5 ${s.cls}`}>
              <s.icon size={18} />
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main grid ── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Left: donut + progress bar */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-5 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Budget Overview
            </p>
            <div className="flex justify-center">
              <BudgetDonut pct={pct} isOver={isOver} />
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Budget</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatINR(budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Spent</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatINR(spent)}</span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-700" />
              <div className="flex justify-between font-semibold">
                <span className={isOver ? "text-red-500" : "text-green-600 dark:text-green-400"}>
                  {isOver ? "Over by" : "Remaining"}
                </span>
                <span className={isOver ? "text-red-500" : "text-green-600 dark:text-green-400"}>
                  {isOver ? `+${formatINR(spent - budget)}` : formatINR(remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* Spending Progress bar card */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Spending Progress
              </p>
              {!isOver && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 size={12} />
                  On track
                </span>
              )}
              {isOver && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertTriangle size={12} />
                  Over budget
                </span>
              )}
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`h-full rounded-full transition-colors duration-500 ${progressColor}`}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>₹0</span>
              <span>{formatINR(budget)}</span>
            </div>
          </div>
        </div>

        {/* Right: category breakdown + items */}
        <div className="flex flex-col gap-5 lg:col-span-3">

          {/* Spending by Category — recharts bar chart */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Spending by Category
            </p>
            {categories.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="text-4xl opacity-30">📊</span>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  Add items to see your breakdown
                </p>
                <Link to="/shop" className="mt-3 flex items-center gap-1 text-sm font-medium text-orange-600">
                  Browse products <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={72} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CategoryTooltip />} />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} animationDuration={800}>
                        {barData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map(([cat, amount]) => {
                    const c = CATEGORY_BADGE[cat] ?? DEFAULT_BADGE;
                    return (
                      <span key={cat} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
                        {cat} — {formatINR(amount)}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Cart items list */}
          {items.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cart Items{" "}
                  <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                    {items.length}
                  </span>
                </p>
                <Link to="/shop" className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                  Add more <ArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.category} · x{item.quantity} · {formatINR(item.price)} each
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatINR(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {formatINR(spent)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state when budget set but cart empty */}
      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-5 rounded-xl border border-dashed border-orange-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900"
        >
          <span className="text-5xl opacity-30">🛒</span>
          <p className="mt-3 font-semibold text-gray-500 dark:text-gray-400">
            Budget is set. Start shopping!
          </p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-orange-700"
          >
            Shop Now <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </main>
  );
}

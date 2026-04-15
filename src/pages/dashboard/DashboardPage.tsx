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
import { useCartStore } from "@/store/cart-store";
import { useBudgetStore } from "@/store/budget-store";

const CATEGORY_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  Fruits:  { bar: "bg-green-500",  bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-700 dark:text-green-400" },
  Dairy:   { bar: "bg-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-700 dark:text-blue-400"  },
  Bakery:  { bar: "bg-amber-500",  bg: "bg-amber-50 dark:bg-amber-900/20",  text: "text-amber-700 dark:text-amber-400"},
  Meat:    { bar: "bg-red-500",    bg: "bg-red-50 dark:bg-red-900/20",      text: "text-red-700 dark:text-red-400"    },
  Grains:  { bar: "bg-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20",text: "text-yellow-700 dark:text-yellow-400"},
  Pantry:  { bar: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20",text: "text-purple-700 dark:text-purple-400"},
};
const DEFAULT_COLOR = { bar: "bg-gray-400", bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" };

/* ── SVG Donut ───────────────────────────────────────────── */
function DonutChart({ pct, isOver }: { pct: number; isOver: boolean }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const clamped = Math.min(pct, 100);
  const [offset, setOffset] = useState(C);

  useEffect(() => {
    const id = setTimeout(() => setOffset(C - (clamped / 100) * C), 80);
    return () => clearTimeout(id);
  }, [clamped, C]);

  const color = isOver ? "#ef4444" : pct > 75 ? "#f59e0b" : "#f97316";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="148" height="148" className="-rotate-90">
        <circle cx="74" cy="74" r={R} fill="none" strokeWidth="14"
          className="stroke-gray-100" />
        <circle cx="74" cy="74" r={R} fill="none" strokeWidth="14"
          stroke={color}
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.3s" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-black leading-none" style={{ color }}>
          {Math.round(pct)}%
        </p>
        <p className="mt-0.5 text-xs font-medium text-gray-400">used</p>
      </div>
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

  const categories = Object.entries(
    items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.price * item.quantity;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

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
              You already have ₹{spent.toFixed(2)} in your cart.
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

  /* ── Stat cards data ── */
  const stats = [
    {
      label: "Total Budget",
      value: `₹${budget.toFixed(2)}`,
      icon: Target,
      cls: "bg-blue-50 text-blue-600",
    },
    {
      label: "Amount Spent",
      value: `₹${spent.toFixed(2)}`,
      icon: ShoppingBag,
      cls: "bg-orange-50 text-orange-600",
    },
    {
      label: isOver ? "Over Budget" : "Remaining",
      value: isOver ? `+₹${(spent - budget).toFixed(2)}` : `₹${remaining.toFixed(2)}`,
      icon: isOver ? AlertTriangle : Wallet,
      cls: isOver
        ? "bg-red-50 text-red-600"
        : "bg-violet-50 text-violet-600",
    },
    {
      label: "Budget Used",
      value: `${Math.min(Math.round(pct), 999)}%`,
      icon: TrendingUp,
      cls: isOver
        ? "bg-red-50 text-red-600"
        : pct > 75
        ? "bg-amber-50 text-amber-600"
        : "bg-orange-50 text-orange-600",
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
        <div className="flex gap-2">
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
              You're over budget by ₹{(spent - budget).toFixed(2)}. Consider removing some items.
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
              <DonutChart pct={pct} isOver={isOver} />
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Budget</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{budget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Spent</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{spent.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-700" />
              <div className="flex justify-between font-semibold">
                <span className={isOver ? "text-red-500" : "text-orange-600"}>
                  {isOver ? "Over by" : "Remaining"}
                </span>
                <span className={isOver ? "text-red-500" : "text-orange-600"}>
                  {isOver ? `+₹${(spent - budget).toFixed(2)}` : `₹${remaining.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar card */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Spending Progress
              </p>
              {!isOver && (
                <span className="flex items-center gap-1 text-xs font-medium text-orange-600">
                  <CheckCircle2 size={12} />
                  On track
                </span>
              )}
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`h-full rounded-full ${isOver ? "bg-red-500" : pct > 75 ? "bg-amber-400" : "bg-orange-500"}`}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>₹0</span>
              <span>₹{budget.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right: category breakdown + items */}
        <div className="flex flex-col gap-5 lg:col-span-3">

          {/* Category breakdown */}
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
              <div className="space-y-4">
                {categories.map(([cat, amount]) => {
                  const catPct = spent > 0 ? (amount / spent) * 100 : 0;
                  const c = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR;
                  return (
                    <div key={cat}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
                          {cat}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₹{amount.toFixed(2)}{" "}
                          <span className="font-normal text-gray-400">({Math.round(catPct)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${catPct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className={`h-full rounded-full ${c.bar}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart items list */}
          {items.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cart Items{" "}
                  <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
                    {items.length}
                  </span>
                </p>
                <Link to="/shop" className="flex items-center gap-1 text-xs font-medium text-orange-600">
                  Add more <ArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.category} · ×{item.quantity} · ₹{item.price.toFixed(2)} each
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                  ₹{spent.toFixed(2)}
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

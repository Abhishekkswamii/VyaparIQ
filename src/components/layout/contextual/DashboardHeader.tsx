import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useBudgetStore } from "@/store/budget-store";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { formatINR } from "@/lib/format";
import { CATEGORIES } from "@/components/layout/CategoryBar";
import type { ContextHeaderProps } from "./types";

export default function DashboardHeader({ activeCategory, onCategoryChange }: ContextHeaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    totalBudget: budget,
    totalSpent: spent,
    remainingBudget: remaining,
    usedPercentage: pct,
    hasBudget,
    isOverBudget: isOver,
  } = useBudgetSummary();

  const setBudget = useBudgetStore((s) => s.setBudget);
  const clearBudget = useBudgetStore((s) => s.clearBudget);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const spentPct = Math.min(pct, 100);

  const handleEdit = () => { setInputVal(String(budget)); setEditing(true); };
  const handleSave = () => {
    const v = parseFloat(inputVal);
    if (!isNaN(v) && v > 0) { setBudget(v); setEditing(false); }
  };
  const handleReset = () => { clearBudget(); setEditing(false); };

  return (
    <div>

      {/* ── Category tabs ── */}
      <div
        ref={scrollRef}
        className="scrollbar-hide mx-auto flex max-w-[1440px] items-center gap-0.5 overflow-x-auto px-4 sm:px-6 lg:px-8"
      >
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => onCategoryChange(id)}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={14} className={isActive ? "text-orange-500" : "text-gray-400"} />
              {label}
              {isActive && (
                <motion.span
                  layoutId="cat-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-orange-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {hasBudget ? (
        <>
          {/* ── Unified budget row: left stats · right actions ── */}
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-y-1 px-4 py-2 sm:px-6 lg:px-8">
            {/* Left: Budget · Spent · Left */}
            <div className="flex flex-wrap items-center gap-1 text-xs sm:gap-3">
              <span className="text-gray-400 dark:text-gray-500">
                Budget{" "}
                <span className="font-bold text-gray-800 dark:text-gray-200">{formatINR(budget)}</span>
              </span>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="text-gray-400 dark:text-gray-500">
                Spent{" "}
                <span className={`font-bold ${isOver ? "text-red-500" : "text-orange-500"}`}>{formatINR(spent)}</span>
              </span>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <span className="text-gray-400 dark:text-gray-500">
                Left{" "}
                <span className={`font-bold ${isOver ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {isOver ? `−${formatINR(spent - budget)}` : formatINR(remaining)}
                </span>
              </span>
            </div>

            {/* Right: % used · Edit · Reset */}
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-bold tabular-nums ${
                isOver ? "text-red-500" : pct > 80 ? "text-amber-500" : "text-gray-400 dark:text-gray-500"
              }`}>
                {Math.round(pct)}% used
              </span>
              <div className="h-3 w-px bg-gray-200 dark:bg-gray-700" />
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
              >
                <RefreshCw size={11} />
                Edit Budget
              </button>
              <button
                onClick={handleReset}
                className="text-xs font-medium text-red-400 transition-colors hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
              >
                Reset
              </button>
            </div>
          </div>

          {/* ── Inline edit form (slides in) ── */}
          <AnimatePresence>
            {editing && (
              <motion.div
                key="budget-edit"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 pb-2 sm:px-6 lg:px-8">
                  <span className="text-xs text-gray-400 dark:text-gray-500">New budget:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                    <input
                      autoFocus
                      aria-label="New budget amount"
                      placeholder="e.g. 5000"
                      type="number"
                      min="0"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") setEditing(false);
                      }}
                      className="h-8 w-32 rounded-lg border border-gray-200 bg-white pl-7 pr-2 text-sm font-bold text-gray-900 outline-none transition focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    className="h-8 rounded-lg bg-orange-600 px-4 text-xs font-bold text-white hover:bg-orange-700 active:scale-95"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="h-8 rounded-lg px-3 text-xs font-medium text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Single unified progress bar: orange (spent) + green (remaining) ── */}
          <div className="flex h-[3px] w-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full shrink-0 ${isOver ? "bg-red-500" : "bg-orange-400"}`}
            />
            {!isOver && (
              <div className="h-full flex-1 bg-emerald-400 dark:bg-emerald-500" />
            )}
          </div>
        </>
      ) : (
        /* No-budget fallback: single thin separator */
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
      )}
    </div>
  );
}

import { motion } from "framer-motion";
import { Download, TrendingUp } from "lucide-react";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { formatINR } from "@/lib/format";
import type { ContextHeaderProps } from "./types";

type DateRange = "week" | "month" | "3months";

const DATE_TABS: { id: DateRange; label: string }[] = [
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "3months", label: "3 Months" },
];

export default function AnalyticsHeader({ dateRange, onDateChange }: ContextHeaderProps) {
  const { totalBudget: budget, totalSpent: spent, usedPercentage, hasBudget } = useBudgetSummary();

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Date Range", dateRange],
      ["Current Cart Value", formatINR(spent)],
      ["Budget", hasBudget ? formatINR(budget) : "Not set"],
      ["Budget Used %", hasBudget ? `${Math.round(usedPercentage)}%` : "—"],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `analytics-${dateRange}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── Top bar: title + insight chip + export ── */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
        <div className="shrink-0">
          <p className="text-base font-extrabold text-gray-900 dark:text-white">
            Analytics
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Spending insights
          </p>
        </div>

        {/* Spending insight chip */}
        {spent > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 sm:flex dark:bg-orange-500/10">
            <TrendingUp size={12} className="text-orange-500" />
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
              Cart: {formatINR(spent)}
              {hasBudget && (
                <span className="ml-1 text-orange-500">
                  · {Math.round((spent / budget) * 100)}% of budget
                </span>
              )}
            </span>
          </div>
        )}

        {/* Export CSV */}
        <button
          onClick={handleExport}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-orange-500 dark:hover:text-orange-400"
        >
          <Download size={13} />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* ── Date range tabs ── */}
      <div className="scrollbar-hide mx-auto flex max-w-5xl items-center overflow-x-auto px-5">
        {DATE_TABS.map((tab) => {
          const isActive = dateRange === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onDateChange(tab.id)}
              className={`relative shrink-0 px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="analytics-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-orange-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

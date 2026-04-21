import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { usePrediction } from "@/hooks/usePrediction";
import { useBudgetStore } from "@/store/budget-store";
import { formatINR } from "@/lib/format";

export default function PredictiveBanner() {
  const budget = useBudgetStore((s) => s.budget);
  const prediction = usePrediction();

  if (budget <= 0) return null;

  const Icon = prediction.willExceed
    ? AlertTriangle
    : prediction.confidence > 0.7
      ? TrendingUp
      : CheckCircle2;

  const borderColor = prediction.willExceed
    ? "border-red-200 dark:border-red-800/40"
    : prediction.confidence > 0.7
      ? "border-amber-200 dark:border-amber-800/40"
      : "border-green-200 dark:border-green-800/40";

  const bgColor = prediction.willExceed
    ? "bg-red-50 dark:bg-red-500/10"
    : prediction.confidence > 0.7
      ? "bg-amber-50 dark:bg-amber-500/10"
      : "bg-green-50 dark:bg-green-500/10";

  const iconColor = prediction.willExceed
    ? "text-red-500"
    : prediction.confidence > 0.7
      ? "text-amber-500"
      : "text-green-500";

  const textColor = prediction.willExceed
    ? "text-red-800 dark:text-red-300"
    : prediction.confidence > 0.7
      ? "text-amber-800 dark:text-amber-300"
      : "text-green-800 dark:text-green-300";

  const subColor = prediction.willExceed
    ? "text-red-600 dark:text-red-400"
    : prediction.confidence > 0.7
      ? "text-amber-600 dark:text-amber-400"
      : "text-green-600 dark:text-green-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${borderColor} ${bgColor} p-4`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-white/10">
          <Brain size={16} className={iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon size={13} className={iconColor} />
            <p className={`text-sm font-semibold ${textColor}`}>
              {prediction.willExceed ? "Budget at risk" : "Budget forecast"}
            </p>
          </div>
          <p className={`mt-0.5 text-xs ${subColor}`}>
            {prediction.message}
          </p>
          {prediction.projectedTotal > 0 && (
            <p className={`mt-1 text-xs ${subColor} opacity-75`}>
              Projected: {formatINR(prediction.projectedTotal)} &middot;{" "}
              Confidence: {Math.round(prediction.confidence * 100)}%
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

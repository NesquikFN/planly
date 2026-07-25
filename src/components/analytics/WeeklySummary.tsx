"use client";

import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeeklySummaryData } from "@/types/analytics";

interface WeeklySummaryProps {
  summary: WeeklySummaryData;
  onOpenPlan: () => void;
}

export function WeeklySummary({ summary, onOpenPlan }: WeeklySummaryProps) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-gray-900">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Итог недели</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">{summary.text}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {summary.highlights.map((highlight) => (
          <span
            key={highlight.label}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              highlight.tone === "positive"
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {highlight.label}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenPlan}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        <ClipboardList size={16} />
        Составить план на следующую неделю
      </button>
    </section>
  );
}

"use client";

import { ClipboardList } from "lucide-react";
import { BUTTON_PRIMARY } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import type { WeeklySummaryData } from "@/types/analytics";

interface WeeklySummaryProps {
  summary: WeeklySummaryData;
  onOpenPlan: () => void;
}

export function WeeklySummary({ summary, onOpenPlan }: WeeklySummaryProps) {
  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-6 shadow-sm dark:bg-surface dark:shadow-none">
      <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Итог недели</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-ink-dim">{summary.text}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {summary.highlights.map((highlight) => (
          <span
            key={highlight.label}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              highlight.tone === "positive"
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-gray-100 text-gray-500 dark:bg-surface-2 dark:text-ink-faint",
            )}
          >
            {highlight.label}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenPlan}
        className={cn(BUTTON_PRIMARY, "rounded-xl px-4 py-2.5")}
      >
        <ClipboardList size={16} />
        Составить план на следующую неделю
      </button>
    </section>
  );
}

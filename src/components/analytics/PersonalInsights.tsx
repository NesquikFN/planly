"use client";

import { CheckCircle2, Lightbulb } from "lucide-react";
import type { ImprovementItem, InsightItem } from "@/types/analytics";

interface PersonalInsightsProps {
  strengths: InsightItem[];
  improvements: ImprovementItem[];
  onAction: (item: ImprovementItem) => void;
}

export function PersonalInsights({ strengths, improvements, onAction }: PersonalInsightsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Что у вас получается лучше всего</h2>
        <ul className="mt-3 space-y-3">
          {strengths.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              <span className="text-gray-600 dark:text-gray-300">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Что можно улучшить</h2>
        <ul className="mt-3 space-y-3">
          {improvements.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 text-sm">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="text-gray-600 dark:text-gray-300">{item.text}</p>
                <button
                  type="button"
                  onClick={() => onAction(item)}
                  className="mt-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {item.actionLabel}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

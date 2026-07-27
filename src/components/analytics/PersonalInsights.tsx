"use client";

import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import type { ImprovementItem, InsightItem, InsightSeverity } from "@/types/analytics";

interface PersonalInsightsProps {
  strengths: InsightItem[];
  improvements: ImprovementItem[];
  onAction: (item: ImprovementItem) => void;
}

const SEVERITY_ICON: Record<InsightSeverity, LucideIcon> = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLOR: Record<InsightSeverity, string> = {
  positive: "text-emerald-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export function PersonalInsights({ strengths, improvements, onAction }: PersonalInsightsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Что у вас получается лучше всего</h2>
        {strengths.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Пока нет данных для выводов</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {strengths.map((item) => {
              const Icon = SEVERITY_ICON[item.severity];
              return (
                <li key={item.id} className="flex items-start gap-2.5 text-sm">
                  <Icon size={16} className={`mt-0.5 shrink-0 ${SEVERITY_COLOR[item.severity]}`} />
                  <span className="text-gray-600 dark:text-gray-300">{item.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Что можно улучшить</h2>
        {improvements.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Замечаний пока нет</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {improvements.map((item) => {
              const Icon = SEVERITY_ICON[item.severity];
              return (
                <li key={item.id} className="flex items-start gap-2.5 text-sm">
                  <Icon size={16} className={`mt-0.5 shrink-0 ${SEVERITY_COLOR[item.severity]}`} />
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
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

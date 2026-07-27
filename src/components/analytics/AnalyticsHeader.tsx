"use client";

import { CalendarRange, Download, MoreHorizontal, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsPeriod } from "@/types/analytics";

const PERIOD_OPTIONS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "quarter", label: "3 месяца" },
  { key: "year", label: "Год" },
  { key: "all", label: "Всё время" },
];

interface AnalyticsHeaderProps {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  periodLabel: string;
  compareEnabled: boolean;
  onToggleCompare: () => void;
  onExport: () => void;
  onMoreSettings: () => void;
  onCustomRange: () => void;
}

export function AnalyticsHeader({
  period,
  onPeriodChange,
  periodLabel,
  compareEnabled,
  onToggleCompare,
  onExport,
  onMoreSettings,
  onCustomRange,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm text-gray-400 dark:text-gray-500">Ваши результаты, прогресс и продуктивность</p>
        <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">{periodLabel}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onPeriodChange(option.key)}
              aria-pressed={period === option.key}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                period === option.key
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCustomRange}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-medium text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <CalendarRange size={14} />
          Свой диапазон
        </button>

        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={compareEnabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition-colors",
            compareEnabled
              ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400"
              : "border-gray-100 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800",
          )}
        >
          <Scale size={14} />
          Сравнить с прошлым периодом
        </button>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Download size={14} />
          Экспорт отчёта
        </button>

        <button
          type="button"
          onClick={onMoreSettings}
          aria-label="Дополнительные настройки"
          className="rounded-xl border border-gray-100 bg-white p-2 text-gray-400 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}

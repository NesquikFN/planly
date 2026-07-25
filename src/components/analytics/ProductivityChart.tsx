"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DailyPoint, ProductivityMetric } from "@/types/analytics";

const CHART_WIDTH = 640;
const CHART_HEIGHT = 200;
const PADDING_Y = 12;

const METRIC_OPTIONS: { key: ProductivityMetric; label: string }[] = [
  { key: "score", label: "Общий результат" },
  { key: "tasks", label: "Выполненные задачи" },
  { key: "focus", label: "Фокус-время" },
  { key: "onTime", label: "Соблюдение сроков" },
];

function formatFocus(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} ч` : `${hours} ч ${mins} мин`;
}

function metricValue(point: DailyPoint, metric: ProductivityMetric): number {
  switch (metric) {
    case "tasks":
      return point.tasksCompleted;
    case "focus":
      return point.focusMinutes;
    case "onTime":
      return point.onTimeRate;
    case "score":
    default:
      return point.score;
  }
}

interface ProductivityChartProps {
  data: DailyPoint[];
  compareEnabled: boolean;
}

export function ProductivityChart({ data, compareEnabled }: ProductivityChartProps) {
  const [metric, setMetric] = useState<ProductivityMetric>("score");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const values = data.map((point) => metricValue(point, metric));
  const maxValue = metric === "score" || metric === "onTime" ? 100 : Math.max(...values) * 1.2;
  const minValue = 0;

  const step = data.length > 1 ? CHART_WIDTH / (data.length - 1) : 0;

  function toY(value: number): number {
    const usable = CHART_HEIGHT - PADDING_Y * 2;
    const ratio = (value - minValue) / (maxValue - minValue || 1);
    return PADDING_Y + usable - ratio * usable;
  }

  const currentPoints = values.map((value, index) => `${(index * step).toFixed(1)},${toY(value).toFixed(1)}`).join(" ");
  const showCompare = compareEnabled && metric === "score";
  const comparePoints = showCompare
    ? data.map((point, index) => `${(index * step).toFixed(1)},${toY(point.prevScore).toFixed(1)}`).join(" ")
    : "";

  const areaPath = `M0,${CHART_HEIGHT} L${currentPoints} L${CHART_WIDTH},${CHART_HEIGHT} Z`;

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const tooltipLeftPercent = hoverIndex !== null && data.length > 1 ? (hoverIndex / (data.length - 1)) * 100 : 0;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Динамика продуктивности</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Ваш ежедневный результат</p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/60">
          {METRIC_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMetric(option.key)}
              aria-pressed={metric === option.key}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                metric === option.key
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-50"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {showCompare && (
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-blue-600" />
            Текущий период
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-gray-300 dark:bg-gray-600" />
            Прошлый период
          </span>
        </div>
      )}

      <div className="relative mt-4">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-52 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="productivity-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#productivity-area)" />

          {showCompare && (
            <polyline points={comparePoints} fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-300 dark:text-gray-600" strokeLinecap="round" strokeLinejoin="round" />
          )}

          <polyline points={currentPoints} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {values.map((value, index) => (
            <circle
              key={index}
              cx={index * step}
              cy={toY(value)}
              r={hoverIndex === index ? 5 : 3}
              fill="#4f46e5"
              className="transition-all"
            />
          ))}

          {hoverIndex !== null && (
            <line
              x1={hoverIndex * step}
              x2={hoverIndex * step}
              y1={PADDING_Y}
              y2={CHART_HEIGHT - PADDING_Y}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 3"
              className="text-gray-200 dark:text-gray-700"
            />
          )}

          {data.map((_, index) => (
            <rect
              key={index}
              x={index * step - step / 2}
              y={0}
              width={step}
              height={CHART_HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-3 text-xs shadow-sm dark:border-gray-800 dark:bg-gray-900"
            style={{ left: `${tooltipLeftPercent}%` }}
          >
            <p className="font-semibold text-gray-900 dark:text-gray-50">{hovered.label}</p>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Результат: {hovered.score}</p>
            <p className="text-gray-500 dark:text-gray-400">Задач выполнено: {hovered.tasksCompleted}</p>
            <p className="text-gray-500 dark:text-gray-400">Фокус: {formatFocus(hovered.focusMinutes)}</p>
          </div>
        )}
      </div>

      <div className="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
        {data.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </section>
  );
}

"use client";

import { AlertTriangle, CheckCircle2, Clock, FolderKanban, Timer, type LucideIcon } from "lucide-react";
import type { MetricAccent, MetricCardData } from "@/types/analytics";

const ICONS: Record<string, LucideIcon> = {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Timer,
};

interface MetricCardsProps {
  metrics: MetricCardData[];
  activeMetric: string | null;
  onToggleMetric: (metricKey: string) => void;
}

export function MetricCards({ metrics, activeMetric, onToggleMetric }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = ICONS[metric.icon] ?? CheckCircle2;
        return (
          <button
            key={metric.key}
            type="button"
            onClick={() => onToggleMetric(metric.key)}
            aria-pressed={activeMetric === metric.key}
            className={`flex w-full cursor-pointer flex-col items-start justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-900 dark:focus-visible:ring-offset-gray-950 ${
              activeMetric === metric.key
                ? `${toneBorder(metric.accent)} shadow-md`
                : "border-gray-100 dark:border-gray-800"
            }`}
          >
            <div className="flex w-full items-start justify-between">
              <p className={`text-sm font-medium ${toneText(metric.accent)}`}>{metric.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneWrap(metric.accent)}`}>
                <Icon size={16} className={toneIcon(metric.accent)} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">{metric.value}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{metric.helper}</p>
          </button>
        );
      })}
    </div>
  );
}

function toneBorder(accent: MetricAccent): string {
  return {
    green: "border-emerald-300 dark:border-emerald-500/60",
    blue: "border-blue-300 dark:border-blue-500/60",
    red: "border-red-300 dark:border-red-500/60",
    purple: "border-violet-300 dark:border-violet-500/60",
    amber: "border-amber-300 dark:border-amber-500/60",
  }[accent];
}

function toneText(accent: MetricAccent): string {
  return {
    green: "text-emerald-600",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-500",
    purple: "text-violet-600",
    amber: "text-amber-500",
  }[accent];
}

function toneWrap(accent: MetricAccent): string {
  return {
    green: "bg-emerald-50 dark:bg-emerald-500/10",
    blue: "bg-blue-50 dark:bg-blue-500/10",
    red: "bg-red-50 dark:bg-red-500/10",
    purple: "bg-violet-50 dark:bg-violet-500/10",
    amber: "bg-amber-50 dark:bg-amber-500/10",
  }[accent];
}

function toneIcon(accent: MetricAccent): string {
  return {
    green: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-500",
    purple: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-500",
  }[accent];
}

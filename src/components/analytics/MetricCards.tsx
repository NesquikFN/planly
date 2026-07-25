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
}

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = ICONS[metric.icon] ?? CheckCircle2;
        return (
          <div
            key={metric.key}
            className="flex w-full flex-col items-start justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex w-full items-start justify-between">
              <p className={`text-sm font-medium ${toneText(metric.accent)}`}>{metric.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneWrap(metric.accent)}`}>
                <Icon size={16} className={toneIcon(metric.accent)} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">{metric.value}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{metric.helper}</p>
          </div>
        );
      })}
    </div>
  );
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

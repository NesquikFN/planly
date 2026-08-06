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
        const active = activeMetric === metric.key;
        return (
          <button
            key={metric.key}
            type="button"
            onClick={() => onToggleMetric(metric.key)}
            aria-pressed={active}
            className={`flex w-full cursor-pointer flex-col items-start justify-between rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 dark:bg-surface dark:shadow-none dark:hover:border-white/20 dark:focus-visible:ring-offset-canvas ${
              active ? "border-accent" : "border-gray-100 dark:border-white/8"
            }`}
          >
            <div className="flex w-full items-start justify-between">
              <p className={`text-sm font-medium ${toneText(metric.accent)}`}>{metric.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneWrap(metric.accent)}`}>
                <Icon size={16} className={toneIcon(metric.accent)} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-ink">{metric.value}</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-ink-faint">{metric.helper}</p>
          </button>
        );
      })}
    </div>
  );
}

// Light theme keeps its per-metric tint (this is category information — which
// metric is which — not a primary action), dark theme goes near-monochrome
// for the icon chip, matching the StatCard pattern used elsewhere. Selection
// state is accent-only (border above), never a tone-colored border.
function toneText(accent: MetricAccent): string {
  return {
    green: "text-emerald-600 dark:text-ink-dim",
    blue: "text-blue-600 dark:text-ink-dim",
    red: "text-red-500 dark:text-ink-dim",
    purple: "text-violet-600 dark:text-ink-dim",
    amber: "text-amber-500 dark:text-ink-dim",
  }[accent];
}

function toneWrap(accent: MetricAccent): string {
  return {
    green: "bg-emerald-50 dark:bg-surface-2",
    blue: "bg-blue-50 dark:bg-surface-2",
    red: "bg-red-50 dark:bg-surface-2",
    purple: "bg-violet-50 dark:bg-surface-2",
    amber: "bg-amber-50 dark:bg-surface-2",
  }[accent];
}

function toneIcon(accent: MetricAccent): string {
  return {
    green: "text-emerald-600 dark:text-ink-faint",
    blue: "text-blue-600 dark:text-ink-faint",
    red: "text-red-500 dark:text-ink-faint",
    purple: "text-violet-600 dark:text-ink-faint",
    amber: "text-amber-500 dark:text-ink-faint",
  }[accent];
}

"use client";

import type { ReactNode } from "react";

interface DangerZoneItemProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function DangerZoneItem({ title, description, actionLabel, onAction }: DangerZoneItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-ink-dim">{title}</p>
        <p className="text-xs text-gray-400 dark:text-ink-faint">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function DangerZone({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-500/20 dark:bg-surface">
      <h3 className="text-sm font-semibold text-red-500 dark:text-red-400">Опасная зона</h3>
      <div className="mt-2 divide-y divide-gray-100 dark:divide-white/8">{children}</div>
    </section>
  );
}

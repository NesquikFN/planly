"use client";

import { Bell } from "lucide-react";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import type { Project } from "@/types/project";

export function ProjectActivityTab({ project }: { project: Project }) {
  if (!project.activity.length) return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-white/8 dark:bg-surface">
      <Bell size={28} className="text-gray-300 dark:text-ink-faint" />
      <p className="mt-3 text-sm font-medium text-gray-500 dark:text-ink-faint">Пока нет активности</p>
    </div>
  );
  return (
    <section className={projectCard}>
      <h3 className={projectSectionTitle}>Активность</h3>
      <ul className="mt-4 space-y-4">
        {[...project.activity].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-surface-2 dark:text-ink-faint"><Bell size={14} /></div>
            <div>
              <p className="text-sm text-gray-600 dark:text-ink-dim"><span className="font-medium text-gray-900 dark:text-ink">{entry.actorName ?? entry.actor}</span> {entry.message}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-ink-faint">{entry.createdAt ? new Date(entry.createdAt).toLocaleString("ru-RU") : entry.timeLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

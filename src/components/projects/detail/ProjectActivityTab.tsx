"use client";

import { Bell } from "lucide-react";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import type { Project } from "@/types/project";

export function ProjectActivityTab({ project }: { project: Project }) {
  if (!project.activity.length) return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
      <Bell size={28} className="text-gray-300 dark:text-gray-600" />
      <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Пока нет активности</p>
    </div>
  );
  return (
    <section className={projectCard}>
      <h3 className={projectSectionTitle}>Активность</h3>
      <ul className="mt-4 space-y-4">
        {[...project.activity].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><Bell size={14} /></div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-gray-50">{entry.actorName ?? entry.actor}</span> {entry.message}</p>
              <p className="mt-0.5 text-xs text-gray-400">{entry.createdAt ? new Date(entry.createdAt).toLocaleString("ru-RU") : entry.timeLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

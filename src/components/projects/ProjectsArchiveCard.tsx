"use client";

import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectsArchiveCardProps {
  archivedProjects: Project[];
  onRestore: (id: string) => void;
  onDeleteRequest: (project: Project) => void;
}

export function ProjectsArchiveCard({ archivedProjects, onRestore, onDeleteRequest }: ProjectsArchiveCardProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Архив</h2>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">Завершённые и неактивные проекты</p>
        </div>
      </div>

      {archivedProjects.length === 0 ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-gray-800">
          <Archive size={24} className="text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Пусто</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">0 проектов в архиве</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {archivedProjects.map((project) => {
            const Icon = project.icon;
            const styles = calendarColorStyles[project.color];
            return (
              <li key={project.id} className="flex items-center gap-3 py-3">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", styles.block)}>
                  <Icon size={16} className={styles.text} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{project.name}</p>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">{project.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRestore(project.id)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                >
                  <RotateCcw size={13} />
                  Восстановить
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRequest(project)}
                  aria-label="Удалить навсегда"
                  className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

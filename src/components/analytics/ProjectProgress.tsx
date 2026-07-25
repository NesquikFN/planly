"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FolderKanban, Trophy } from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { ProjectProgressItem } from "@/types/analytics";

interface ProjectProgressProps {
  projects: ProjectProgressItem[];
}

export function ProjectProgress({ projects }: ProjectProgressProps) {
  const router = useRouter();
  const best = [...projects].sort((a, b) => b.deltaPercent - a.deltaPercent)[0];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Прогресс проектов</h2>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Открыть проекты
          <ArrowRight size={13} />
        </button>
      </div>

      {best && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Trophy size={13} />
          Лучший прогресс недели — {best.name}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {projects.map((project) => {
          const styles = calendarColorStyles[project.color as CalendarColor];
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => router.push("/projects")}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.block)}>
                <FolderKanban size={16} className={styles.text} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{project.name}</span>
                  <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">
                    {project.tasksDone}/{project.tasksTotal} задач
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className={cn("h-full rounded-full", styles.swatch)} style={{ width: `${project.percent}%` }} />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    {project.percent}%
                  </span>
                  <span
                    className={cn(
                      "w-11 shrink-0 text-right text-xs font-medium",
                      project.deltaPercent > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-400 dark:text-gray-500",
                    )}
                  >
                    {project.deltaPercent > 0 ? `+${project.deltaPercent}%` : "0%"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, FolderKanban, FolderX, Trophy } from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { ProjectsAnalyticsData } from "@/types/analytics";

interface ProjectProgressProps {
  data: ProjectsAnalyticsData;
}

export function ProjectProgress({ data }: ProjectProgressProps) {
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Прогресс проектов</h2>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Открыть проекты
          <ArrowRight size={13} />
        </button>
      </div>

      {!data.available ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-white/8">
          <FolderX size={22} className="text-gray-300 dark:text-ink-faint" />
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-ink-faint">Аналитика проектов пока недоступна здесь</p>
          <p className="mt-1 max-w-xs text-xs text-gray-400 dark:text-ink-faint">
            Данные о проектах хранятся только на странице «Проекты» — откройте её, чтобы посмотреть прогресс.
          </p>
        </div>
      ) : data.items.length === 0 ? (
        <p className="mt-4 py-6 text-center text-sm text-gray-400 dark:text-ink-faint">Проектов пока нет</p>
      ) : (
        <>
          {data.mostActive && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Trophy size={13} />
              Больше всего выполнено задач — {data.mostActive.name}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {data.items.map((project) => {
              const styles = calendarColorStyles[project.color as CalendarColor];
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => router.push("/projects")}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-surface-2"
                >
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.block)}>
                    <FolderKanban size={16} className={styles.text} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-ink">{project.name}</span>
                      <span className="shrink-0 text-xs font-medium text-gray-400 dark:text-ink-faint">
                        {project.tasksDone}/{project.tasksTotal} задач
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-surface-2">
                        <div className={cn("h-full rounded-full", styles.swatch)} style={{ width: `${project.percent}%` }} />
                      </div>
                      <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-ink-faint">
                        {project.percent}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

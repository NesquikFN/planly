"use client";

import { AlertTriangle, ArrowLeft, CalendarDays, ListChecks, Pencil, Star, Trash2 } from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { PROJECT_PRIORITY_BADGE, PROJECT_PRIORITY_LABELS, PROJECT_STATUS_BADGE, PROJECT_STATUS_LABELS } from "@/lib/projects";
import { PROJECT_ICON_MAP } from "@/lib/projects-mock-data";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectDetailHeaderProps {
  project: Project;
  isOverdue: boolean;
  onBack: () => void;
  onToggleStar: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

export function ProjectDetailHeader({ project, isOverdue, onBack, onToggleStar, onEdit, onDeleteRequest }: ProjectDetailHeaderProps) {
  const Icon = PROJECT_ICON_MAP[project.iconKey];
  const styles = calendarColorStyles[project.color];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <ArrowLeft size={15} />
        Все проекты
      </button>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", styles.block)}>
            <Icon size={26} className={styles.text} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-50 sm:text-2xl">{project.name}</h1>
              <button
                type="button"
                onClick={onToggleStar}
                aria-pressed={project.starred}
                aria-label={project.starred ? "Убрать из избранного" : "Добавить в избранное"}
                className="rounded-lg p-1 text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800"
              >
                <Star size={18} className={project.starred ? "fill-amber-400 text-amber-400" : undefined} />
              </button>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{project.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", PROJECT_STATUS_BADGE[project.status])}>
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", PROJECT_PRIORITY_BADGE[project.priority])}>
                {PROJECT_PRIORITY_LABELS[project.priority]}
              </span>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Pencil size={14} />
            Изменить
          </button>
          <button
            type="button"
            onClick={onDeleteRequest}
            aria-label="Удалить проект"
            className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:border-gray-700 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>Прогресс</span>
            <span className="font-medium text-gray-600 dark:text-gray-300">{project.progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
            <div className={cn("h-1.5 rounded-full", styles.swatch)} style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <ListChecks size={15} className="shrink-0" />
          {project.tasksDone} из {project.tasksTotal} задач выполнено
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-sm",
            isOverdue ? "font-medium text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400",
          )}
        >
          {isOverdue ? <AlertTriangle size={15} className="shrink-0" /> : <CalendarDays size={15} className="shrink-0" />}
          {isOverdue ? `Просрочено — дедлайн ${project.deadlineLabel}` : `Дедлайн: ${project.deadlineLabel}`}
        </div>
      </div>
    </section>
  );
}

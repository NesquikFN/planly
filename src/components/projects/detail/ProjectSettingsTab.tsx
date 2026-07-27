"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { CALENDAR_COLORS } from "@/lib/calendar-constants";
import { PROJECT_PRIORITY_LABELS, PROJECT_STATUS_LABELS, projectCard, projectSectionTitle } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { Project, ProjectFormValues, ProjectPriority, ProjectStatus } from "@/types/project";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

function valuesFromProject(project: Project): ProjectFormValues {
  return {
    name: project.name,
    description: project.description,
    color: project.color,
    status: project.status,
    priority: project.priority,
    deadlineKey: project.deadlineKey ?? "",
    tags: project.tags.join(", "),
  };
}

interface ProjectSettingsTabProps {
  project: Project;
  onSave: (values: ProjectFormValues) => void;
  onDeleteRequest: () => void;
}

export function ProjectSettingsTab({ project, onSave, onDeleteRequest }: ProjectSettingsTabProps) {
  const [values, setValues] = useState<ProjectFormValues>(() => valuesFromProject(project));
  const [saved, setSaved] = useState(false);

  // Re-sync the draft if the underlying project identity changes (navigating
  // to a different project id re-mounts this route, but this guards against
  // client-side navigation reusing the component instance).
  useEffect(() => {
    setValues(valuesFromProject(project));
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) return;
    onSave(values);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <section className={projectCard}>
        <h3 className={projectSectionTitle}>Настройки проекта</h3>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className={labelClass}>Название</span>
            <input type="text" value={values.name} onChange={(event) => update("name", event.target.value)} className={inputClass} required />
          </label>

          <label className="block">
            <span className={labelClass}>Описание</span>
            <textarea
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
          </label>

          <div>
            <span className={labelClass}>Цвет</span>
            <div className="flex flex-wrap items-center gap-2">
              {CALENDAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update("color", color as CalendarColor)}
                  aria-label={color}
                  aria-pressed={values.color === color}
                  className={cn(
                    "h-6 w-6 rounded-full transition-shadow",
                    calendarColorStyles[color].swatch,
                    values.color === color && "ring-2 ring-gray-400 ring-offset-2 dark:ring-gray-500 dark:ring-offset-gray-900",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Статус</span>
              <select value={values.status} onChange={(event) => update("status", event.target.value as ProjectStatus)} className={inputClass}>
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Приоритет</span>
              <select
                value={values.priority}
                onChange={(event) => update("priority", event.target.value as ProjectPriority)}
                className={inputClass}
              >
                {(Object.keys(PROJECT_PRIORITY_LABELS) as ProjectPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {PROJECT_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Дедлайн</span>
              <PlanlyDatePicker value={values.deadlineKey} onChange={(next) => update("deadlineKey", next)} />
            </label>
            <label className="block">
              <span className={labelClass}>Теги (через запятую)</span>
              <input type="text" value={values.tags} onChange={(event) => update("tags", event.target.value)} className={inputClass} />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            {saved && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Сохранено</span>}
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Сохранить
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-500/20 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-red-500 dark:text-red-400">Опасная зона</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Удалить проект</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Безвозвратно удаляет проект и все его данные.</p>
            </div>
            <button
              type="button"
              onClick={onDeleteRequest}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Удалить
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

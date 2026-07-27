"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { CALENDAR_COLORS } from "@/lib/calendar-constants";
import { PROJECT_PRIORITY_LABELS, PROJECT_STATUS_LABELS } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { Project, ProjectFormValues, ProjectPriority, ProjectStatus } from "@/types/project";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

function emptyValues(): ProjectFormValues {
  return { name: "", description: "", color: "blue", status: "active", priority: "medium", deadlineKey: "", tags: "" };
}

interface ProjectFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initial: Project | null;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
}

export function ProjectFormModal({ open, mode, initial, onClose, onSubmit }: ProjectFormModalProps) {
  const [values, setValues] = useState<ProjectFormValues>(emptyValues());

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setValues({
        name: initial.name,
        description: initial.description,
        color: initial.color,
        status: initial.status,
        priority: initial.priority,
        deadlineKey: initial.deadlineKey ?? "",
        tags: initial.tags.join(", "),
      });
    } else {
      setValues(emptyValues());
    }
  }, [open, initial]);

  if (!open) return null;

  function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {mode === "edit" ? "Изменить проект" : "Новый проект"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!values.name.trim()) return;
            onSubmit(values);
          }}
        >
          <label className="block">
            <span className={labelClass}>Название проекта</span>
            <input
              type="text"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              className={inputClass}
              autoFocus
              required
            />
          </label>

          <label className="block">
            <span className={labelClass}>Описание</span>
            <textarea
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              rows={2}
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
              <select
                value={values.status}
                onChange={(event) => update("status", event.target.value as ProjectStatus)}
                className={inputClass}
              >
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
              <input
                type="text"
                value={values.tags}
                onChange={(event) => update("tags", event.target.value)}
                placeholder="дизайн, маркетинг"
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {mode === "edit" ? "Сохранить" : "Создать проект"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

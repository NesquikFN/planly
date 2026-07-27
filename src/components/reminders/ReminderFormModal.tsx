"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { LEAD_TIME_OPTIONS, PRIORITY_OPTIONS, REMINDER_CATEGORIES, REPEAT_OPTIONS } from "@/lib/reminders-mock-data";
import { getLocalDateKey } from "@/lib/date-utils";
import type { Reminder, ReminderCategory, ReminderLeadTime, ReminderPriority, ReminderRepeat } from "@/types/reminder";

export interface ReminderFormValues {
  title: string;
  description: string;
  date: string;
  time: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  repeat: ReminderRepeat;
  leadTime: ReminderLeadTime;
  linkProject: string;
  linkNote: string;
  linkNoteLabel: string;
  linkEvent: string;
}

interface ReminderFormModalProps {
  open: boolean;
  initial: Reminder | null;
  onClose: () => void;
  onSubmit: (values: ReminderFormValues) => void;
  defaults?: Partial<ReminderFormValues>;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

function emptyValues(): ReminderFormValues {
  return {
    title: "",
    description: "",
    date: getLocalDateKey(new Date()),
    time: "",
    category: "work",
    priority: "medium",
    repeat: "none",
    leadTime: "none",
    linkProject: "",
    linkNote: "",
    linkNoteLabel: "",
    linkEvent: "",
  };
}

export function ReminderFormModal({ open, initial, onClose, onSubmit, defaults }: ReminderFormModalProps) {
  const [values, setValues] = useState<ReminderFormValues>(emptyValues());

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setValues({
        title: initial.title,
        description: initial.description ?? "",
        date: initial.date ?? "",
        time: initial.time ?? "",
        category: initial.category,
        priority: initial.priority,
        repeat: initial.repeat,
        leadTime: initial.leadTime,
        linkProject: initial.links?.project ?? "",
        linkNote: initial.links?.note ?? "",
        linkNoteLabel: initial.links?.noteLabel ?? initial.links?.note ?? "",
        linkEvent: initial.links?.event ?? "",
      });
    } else {
      setValues({ ...emptyValues(), ...defaults });
    }
  }, [open, initial, defaults]);

  if (!open) return null;

  function update<K extends keyof ReminderFormValues>(key: K, value: ReminderFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {initial ? "Редактировать напоминание" : "Новое напоминание"}
          </h3>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!values.title.trim()) return;
            onSubmit(values);
          }}
        >
          <label className="block">
            <span className={labelClass}>Название напоминания</span>
            <input type="text" value={values.title} onChange={(event) => update("title", event.target.value)} className={inputClass} autoFocus />
          </label>

          <label className="block">
            <span className={labelClass}>Описание</span>
            <textarea value={values.description} onChange={(event) => update("description", event.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Дата</span>
              <PlanlyDatePicker value={values.date} onChange={(next) => update("date", next)} />
            </label>
            <label className="block">
              <span className={labelClass}>Время</span>
              <PlanlyTimePicker value={values.time} onChange={(next) => update("time", next)} disabled={!values.date} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Категория</span>
              <select value={values.category} onChange={(event) => update("category", event.target.value as ReminderCategory)} className={inputClass}>
                {REMINDER_CATEGORIES.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Приоритет</span>
              <select value={values.priority} onChange={(event) => update("priority", event.target.value as ReminderPriority)} className={inputClass}>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Повторение</span>
              <select value={values.repeat} onChange={(event) => update("repeat", event.target.value as ReminderRepeat)} className={inputClass}>
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Напомнить заранее</span>
              <select value={values.leadTime} onChange={(event) => update("leadTime", event.target.value as ReminderLeadTime)} className={inputClass}>
                {LEAD_TIME_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Связать с</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Проектом</span>
                <input type="text" value={values.linkProject} onChange={(event) => update("linkProject", event.target.value)} placeholder="Например: Клиника 2026" className={inputClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Заметкой</span>
                <input type="text" value={values.linkNoteLabel} onChange={(event) => { update("linkNoteLabel", event.target.value); if (!initial) update("linkNote", event.target.value); }} placeholder="Название заметки" className={inputClass} />
              </label>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800">
              Отмена
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {initial ? "Сохранить" : "Создать напоминание"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

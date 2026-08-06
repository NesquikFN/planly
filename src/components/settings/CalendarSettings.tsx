"use client";

import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { Switch } from "@/components/ui/Switch";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { CalendarSettingsData } from "@/types/settings";

const VIEW_OPTIONS: { key: CalendarSettingsData["defaultView"]; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "agenda", label: "Расписание" },
];

const EVENT_COLORS: CalendarColor[] = ["blue", "green", "purple", "orange", "pink", "red", "teal", "indigo"];

interface CalendarSettingsProps {
  value: CalendarSettingsData;
  onChange: (patch: Partial<CalendarSettingsData>) => void;
}

export function CalendarSettings({ value, onChange }: CalendarSettingsProps) {
  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Отображение</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange({ defaultView: option.key })}
              aria-pressed={value.defaultView === option.key}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                value.defaultView === option.key
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-gray-100 text-gray-500 hover:bg-gray-50 dark:border-white/8 dark:text-ink-faint dark:hover:bg-surface-2",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Первый день недели</span>
            <select value={value.weekStartsOn} onChange={(e) => onChange({ weekStartsOn: e.target.value as "monday" | "sunday" })} className={settingsInput}>
              <option value="monday">Понедельник</option>
              <option value="sunday">Воскресенье</option>
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Шаг времени</span>
            <select value={value.timeStep} onChange={(e) => onChange({ timeStep: Number(e.target.value) as 15 | 30 | 60 })} className={settingsInput}>
              {[15, 30, 60].map((step) => (
                <option key={step} value={step}>
                  {step} минут
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Начало рабочего дня</span>
            <PlanlyTimePicker value={value.workDayStart} onChange={(next) => onChange({ workDayStart: next })} required />
          </label>
          <label className="block">
            <span className={settingsLabel}>Конец рабочего дня</span>
            <PlanlyTimePicker value={value.workDayEnd} onChange={(next) => onChange({ workDayEnd: next })} required />
          </label>
        </div>

        <div className="mt-4 divide-y divide-gray-100 dark:divide-white/8">
          <Switch checked={value.showWeekNumbers} onChange={(c) => onChange({ showWeekNumbers: c })} label="Показывать номера недель" />
          <Switch checked={value.showWeekends} onChange={(c) => onChange({ showWeekends: c })} label="Показывать выходные" />
          <Switch checked={value.showCompletedTasks} onChange={(c) => onChange({ showCompletedTasks: c })} label="Показывать завершённые задачи в календаре" />
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>События</h3>
        <div className="mt-3">
          <span className={settingsLabel}>Цвет событий по умолчанию</span>
          <div className="flex flex-wrap gap-2">
            {EVENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ defaultEventColor: color })}
                aria-pressed={value.defaultEventColor === color}
                aria-label={color}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 dark:ring-offset-surface",
                  value.defaultEventColor === color && "ring-2 ring-gray-300 dark:ring-white/20",
                )}
              >
                <span className={cn("h-6 w-6 rounded-full", calendarColorStyles[color].swatch)} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Длительность события по умолчанию</span>
            <select value={value.defaultEventDuration} onChange={(e) => onChange({ defaultEventDuration: e.target.value })} className={settingsInput}>
              {["30m", "1h", "1h30m", "2h"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Напоминание по умолчанию</span>
            <select value={value.defaultEventReminder} onChange={(e) => onChange({ defaultEventReminder: e.target.value })} className={settingsInput}>
              {["none", "5m", "15m", "30m", "1h"].map((v) => (
                <option key={v} value={v}>
                  {v === "none" ? "Без напоминания" : v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <Switch checked={value.autoAddMeetLink} onChange={(c) => onChange({ autoAddMeetLink: c })} label="Автоматически добавлять Google Meet-ссылку" />
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Часовой пояс</h3>
        <div className="mt-3">
          <Switch checked={value.autoDetectTimezone} onChange={(c) => onChange({ autoDetectTimezone: c })} label="Автоматически определять" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Текущий часовой пояс</span>
            <select
              value={value.timezone}
              disabled={value.autoDetectTimezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
              className={cn(settingsInput, "disabled:opacity-50")}
            >
              {["GMT+4 (Тбилиси)", "GMT+3 (Москва)", "GMT+1 (Берлин)", "GMT+0 (Лондон)"].map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Второй часовой пояс</span>
            <select
              value={value.secondTimezone}
              disabled={!value.showSecondTimezone}
              onChange={(e) => onChange({ secondTimezone: e.target.value })}
              className={cn(settingsInput, "disabled:opacity-50")}
            >
              {["GMT+3 (Москва)", "GMT+1 (Берлин)", "GMT+0 (Лондон)", "GMT-5 (Нью-Йорк)"].map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3">
          <Switch checked={value.showSecondTimezone} onChange={(c) => onChange({ showSecondTimezone: c })} label="Показывать второй часовой пояс" />
        </div>
      </section>
    </div>
  );
}

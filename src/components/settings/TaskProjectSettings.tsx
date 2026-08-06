"use client";

import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { Switch } from "@/components/ui/Switch";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { TaskProjectSettings as TaskProjectSettingsData } from "@/types/settings";

const DAY_OPTIONS = [
  { key: "mon", label: "Пн" },
  { key: "tue", label: "Вт" },
  { key: "wed", label: "Ср" },
  { key: "thu", label: "Чт" },
  { key: "fri", label: "Пт" },
  { key: "sat", label: "Сб" },
  { key: "sun", label: "Вс" },
];

interface TaskProjectSettingsProps {
  value: TaskProjectSettingsData;
  onChange: (patch: Partial<TaskProjectSettingsData>) => void;
}

export function TaskProjectSettings({ value, onChange }: TaskProjectSettingsProps) {
  function toggleWorkDay(day: string) {
    const next = value.workDays.includes(day) ? value.workDays.filter((d) => d !== day) : [...value.workDays, day];
    onChange({ workDays: next });
  }

  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Задачи по умолчанию</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Приоритет по умолчанию</span>
            <select value={value.defaultPriority} onChange={(e) => onChange({ defaultPriority: e.target.value as TaskProjectSettingsData["defaultPriority"] })} className={settingsInput}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Продолжительность по умолчанию</span>
            <select value={value.defaultDuration} onChange={(e) => onChange({ defaultDuration: e.target.value })} className={settingsInput}>
              {["15m", "30m", "45m", "1h", "2h"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Категория по умолчанию</span>
            <select value={value.defaultCategory} onChange={(e) => onChange({ defaultCategory: e.target.value })} className={settingsInput}>
              {["Работа", "Личное", "Здоровье", "Финансы", "Покупки", "Встречи"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Время напоминания</span>
            <select value={value.reminderLeadTime} onChange={(e) => onChange({ reminderLeadTime: e.target.value })} className={settingsInput}>
              {["5m", "15m", "30m", "1h", "1d"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Новый статус задачи</span>
            <select value={value.newTaskStatus} onChange={(e) => onChange({ newTaskStatus: e.target.value })} className={settingsInput}>
              {["В работе", "Без срока", "Черновик"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 divide-y divide-gray-100 dark:divide-white/8">
          <Switch checked={value.autoAddToToday} onChange={(c) => onChange({ autoAddToToday: c })} label="Автоматически добавлять созданные задачи в «Сегодня»" />
          <Switch checked={value.showCompletedTasks} onChange={(c) => onChange({ showCompletedTasks: c })} label="Показывать завершённые задачи" />
          <Switch checked={value.autoArchiveCompleted} onChange={(c) => onChange({ autoArchiveCompleted: c })} label="Автоматически архивировать завершённые задачи" />
          <Switch checked={value.confirmDelete} onChange={(c) => onChange({ confirmDelete: c })} label="Подтверждать удаление" />
          <Switch checked={value.rescheduleOverdueToToday} onChange={(c) => onChange({ rescheduleOverdueToToday: c })} label="Переносить просроченные задачи на сегодня" />
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Проекты</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Представление по умолчанию</span>
            <div className="flex items-center rounded-lg border border-gray-200 p-1 dark:border-white/8">
              {(["grid", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChange({ projectDefaultView: mode })}
                  aria-pressed={value.projectDefaultView === mode}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                    value.projectDefaultView === mode
                      ? "bg-accent/10 text-accent"
                      : "text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2",
                  )}
                >
                  {mode === "grid" ? "Сетка" : "Список"}
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className={settingsLabel}>Сортировка по умолчанию</span>
            <select value={value.projectDefaultSort} onChange={(e) => onChange({ projectDefaultSort: e.target.value })} className={settingsInput}>
              {["По названию", "По прогрессу", "По сроку", "По задачам"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 divide-y divide-gray-100 dark:divide-white/8">
          <Switch checked={value.showCompletedProjects} onChange={(c) => onChange({ showCompletedProjects: c })} label="Показывать завершённые проекты" />
          <Switch checked={value.autoCalculateProgress} onChange={(c) => onChange({ autoCalculateProgress: c })} label="Автоматически считать прогресс по задачам" />
          <Switch checked={value.showArchiveAtBottom} onChange={(c) => onChange({ showArchiveAtBottom: c })} label="Показывать архив внизу страницы" />
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Неделя</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Первый день недели</span>
            <select value={value.weekStartsOn} onChange={(e) => onChange({ weekStartsOn: e.target.value as "monday" | "sunday" })} className={settingsInput}>
              <option value="monday">Понедельник</option>
              <option value="sunday">Воскресенье</option>
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Плановое количество задач в день</span>
            <input
              type="number"
              min={1}
              max={30}
              value={value.dailyTaskGoal}
              onChange={(e) => onChange({ dailyTaskGoal: Number(e.target.value) || 0 })}
              className={settingsInput}
            />
          </label>
          <label className="block">
            <span className={settingsLabel}>Начало рабочего дня</span>
            <PlanlyTimePicker value={value.workHoursStart} onChange={(next) => onChange({ workHoursStart: next })} required />
          </label>
          <label className="block">
            <span className={settingsLabel}>Конец рабочего дня</span>
            <PlanlyTimePicker value={value.workHoursEnd} onChange={(next) => onChange({ workHoursEnd: next })} required />
          </label>
        </div>

        <div className="mt-3">
          <span className={settingsLabel}>Рабочие дни</span>
          <div className="flex flex-wrap gap-1.5">
            {DAY_OPTIONS.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => toggleWorkDay(day.key)}
                aria-pressed={value.workDays.includes(day.key)}
                className={cn(
                  "h-8 w-10 rounded-lg text-xs font-medium transition-colors",
                  value.workDays.includes(day.key)
                    ? "bg-accent/10 text-accent"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-surface-2 dark:hover:bg-surface-2",
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

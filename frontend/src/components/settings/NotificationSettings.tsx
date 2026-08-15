"use client";

import { Fragment } from "react";
import { Bell, Mail, Smartphone, Volume2 } from "lucide-react";
import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { Switch } from "@/components/ui/Switch";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { NotificationSettings as NotificationSettingsData, NotificationTypeKey } from "@/types/settings";

const CHANNEL_META = [
  { key: "inApp" as const, label: "В приложении", icon: Bell },
  { key: "email" as const, label: "Email", icon: Mail },
  { key: "push" as const, label: "Push", icon: Smartphone },
  { key: "sound" as const, label: "Звук", icon: Volume2 },
];

const TYPE_LABELS: Record<NotificationTypeKey, string> = {
  reminders: "Напоминания",
  dueSoon: "Задачи с приближающимся сроком",
  overdue: "Просроченные задачи",
  comments: "Новые комментарии",
  projectChanges: "Изменения в проектах",
  invitations: "Приглашения",
  weeklyReport: "Еженедельный отчёт",
  achievements: "Достижения",
  recommendations: "Рекомендации Planly",
};

const DAY_OPTIONS = [
  { key: "mon", label: "Пн" },
  { key: "tue", label: "Вт" },
  { key: "wed", label: "Ср" },
  { key: "thu", label: "Чт" },
  { key: "fri", label: "Пт" },
  { key: "sat", label: "Сб" },
  { key: "sun", label: "Вс" },
];

const LEAD_TIME_OPTIONS = [
  { key: "5m", label: "За 5 минут" },
  { key: "15m", label: "За 15 минут" },
  { key: "30m", label: "За 30 минут" },
  { key: "1h", label: "За 1 час" },
  { key: "1d", label: "За 1 день" },
];

interface NotificationSettingsProps {
  value: NotificationSettingsData;
  onChange: (patch: Partial<NotificationSettingsData>) => void;
}

export function NotificationSettings({ value, onChange }: NotificationSettingsProps) {
  function toggleTypeChannel(type: NotificationTypeKey, channel: "inApp" | "email" | "push") {
    onChange({
      typeChannels: {
        ...value.typeChannels,
        [type]: { ...value.typeChannels[type], [channel]: !value.typeChannels[type][channel] },
      },
    });
  }

  function toggleArrayValue(list: string[], item: string): string[] {
    return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
  }

  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Каналы</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CHANNEL_META.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 p-3 dark:border-white/8"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-ink-dim">
                <Icon size={15} className="text-gray-400" />
                {label}
              </span>
              <Switch checked={value.channels[key]} onChange={(checked) => onChange({ channels: { ...value.channels, [key]: checked } })} />
            </div>
          ))}
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Типы уведомлений</h3>
        <div className="mt-3 overflow-x-auto">
          <div className="grid min-w-[420px] grid-cols-[1fr_repeat(3,64px)] items-center gap-y-2 text-xs">
            <span />
            <span className="text-center font-medium text-gray-400 dark:text-ink-faint">В прил.</span>
            <span className="text-center font-medium text-gray-400 dark:text-ink-faint">Email</span>
            <span className="text-center font-medium text-gray-400 dark:text-ink-faint">Push</span>

            {(Object.keys(TYPE_LABELS) as NotificationTypeKey[]).map((type) => (
              <Fragment key={type}>
                <span className="py-1.5 text-sm text-gray-600 dark:text-ink-dim">{TYPE_LABELS[type]}</span>
                {(["inApp", "email", "push"] as const).map((channel) => (
                  <span key={`${type}-${channel}`} className="flex justify-center">
                    <Switch checked={value.typeChannels[type][channel]} onChange={() => toggleTypeChannel(type, channel)} />
                  </span>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className={settingsCard}>
        <div className="flex items-center justify-between">
          <h3 className={settingsSectionTitle}>Не беспокоить</h3>
          <Switch checked={value.dndEnabled} onChange={(c) => onChange({ dndEnabled: c })} label="Не отправлять уведомления в это время" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Начало</span>
            <PlanlyTimePicker value={value.dndStart} onChange={(next) => onChange({ dndStart: next })} required />
          </label>
          <label className="block">
            <span className={settingsLabel}>Конец</span>
            <PlanlyTimePicker value={value.dndEnd} onChange={(next) => onChange({ dndEnd: next })} required />
          </label>
        </div>
        <div className="mt-3">
          <span className={settingsLabel}>Дни недели</span>
          <div className="flex flex-wrap gap-1.5">
            {DAY_OPTIONS.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => onChange({ dndDays: toggleArrayValue(value.dndDays, day.key) })}
                aria-pressed={value.dndDays.includes(day.key)}
                className={cn(
                  "h-8 w-10 rounded-lg text-xs font-medium transition-colors",
                  value.dndDays.includes(day.key)
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

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Предварительные напоминания</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-ink-faint">Можно выбрать несколько вариантов по умолчанию</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEAD_TIME_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange({ leadTimes: toggleArrayValue(value.leadTimes, option.key) })}
              aria-pressed={value.leadTimes.includes(option.key)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                value.leadTimes.includes(option.key)
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-gray-100 text-gray-500 hover:bg-gray-50 dark:border-white/8 dark:text-ink-faint dark:hover:bg-surface-2",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

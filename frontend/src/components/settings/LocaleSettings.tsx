"use client";

import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { useClock } from "@/hooks/useClock";
import { formatFullDateLabel } from "@/lib/date-utils";
import type { LocaleSettings as LocaleSettingsData } from "@/types/settings";

interface LocaleSettingsProps {
  value: LocaleSettingsData;
  onChange: (patch: Partial<LocaleSettingsData>) => void;
}

export function LocaleSettings({ value, onChange }: LocaleSettingsProps) {
  const { now } = useClock();

  const dateLabel = formatFullDateLabel(now);
  const timeLabel =
    value.timeFormat === "24h"
      ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      : (() => {
          const hours12 = now.getHours() % 12 || 12;
          const suffix = now.getHours() < 12 ? "AM" : "PM";
          return `${hours12}:${String(now.getMinutes()).padStart(2, "0")} ${suffix}`;
        })();

  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Язык и регион</h3>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Язык интерфейса</span>
            <select value={value.language} onChange={(e) => onChange({ language: e.target.value })} className={settingsInput}>
              {["Русский", "English", "Қартули"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Регион</span>
            <select value={value.region} onChange={(e) => onChange({ region: e.target.value })} className={settingsInput}>
              {["Грузия", "Россия", "Германия", "США"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Формат даты</span>
            <select value={value.dateFormat} onChange={(e) => onChange({ dateFormat: e.target.value })} className={settingsInput}>
              {["ДД.ММ.ГГГГ", "ММ/ДД/ГГГГ", "ГГГГ-ММ-ДД"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Формат времени</span>
            <select value={value.timeFormat} onChange={(e) => onChange({ timeFormat: e.target.value as "24h" | "12h" })} className={settingsInput}>
              <option value="24h">24-часовой</option>
              <option value="12h">12-часовой (AM/PM)</option>
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Первый день недели</span>
            <select value={value.weekStartsOn} onChange={(e) => onChange({ weekStartsOn: e.target.value as "monday" | "sunday" })} className={settingsInput}>
              <option value="monday">Понедельник</option>
              <option value="sunday">Воскресенье</option>
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Система измерений</span>
            <select value={value.measurementSystem} onChange={(e) => onChange({ measurementSystem: e.target.value as "metric" | "imperial" })} className={settingsInput}>
              <option value="metric">Метрическая</option>
              <option value="imperial">Имперская</option>
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Основная валюта</span>
            <select value={value.currency} onChange={(e) => onChange({ currency: e.target.value })} className={settingsInput}>
              {["GEL", "USD", "EUR", "RUB"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Предварительный просмотр</h3>
        <p className="mt-2 text-lg font-medium text-gray-900 dark:text-ink">
          {dateLabel}, {timeLabel}
        </p>
      </section>
    </div>
  );
}

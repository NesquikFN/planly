"use client";

import { Bell, Laptop, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { AccentColor, AppearanceSettings as AppearanceSettingsData, Density, TextSize, ThemePreference } from "@/types/settings";

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Светлая", icon: Sun },
  { key: "dark", label: "Тёмная", icon: Moon },
  { key: "system", label: "Системная", icon: Laptop },
];

const ACCENT_OPTIONS: { key: AccentColor; label: string; swatch: string }[] = [
  { key: "blue", label: "Синий", swatch: "bg-blue-600" },
  { key: "purple", label: "Фиолетовый", swatch: "bg-violet-600" },
  { key: "teal", label: "Голубой", swatch: "bg-teal-500" },
  { key: "green", label: "Зелёный", swatch: "bg-emerald-600" },
  { key: "orange", label: "Оранжевый", swatch: "bg-amber-500" },
];

const DENSITY_OPTIONS: { key: Density; label: string }[] = [
  { key: "compact", label: "Компактная" },
  { key: "standard", label: "Стандартная" },
  { key: "spacious", label: "Просторная" },
];

const TEXT_SIZE_OPTIONS: { key: TextSize; label: string }[] = [
  { key: "small", label: "Маленький" },
  { key: "medium", label: "Средний" },
  { key: "large", label: "Крупный" },
];

interface AppearanceSettingsProps {
  value: AppearanceSettingsData;
  onChange: (patch: Partial<AppearanceSettingsData>) => void;
}

export function AppearanceSettings({ value, onChange }: AppearanceSettingsProps) {
  const previewIsDark =
    value.theme === "dark" || (value.theme === "system" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  const densityPadding = { compact: "p-2.5", standard: "p-4", spacious: "p-6" }[value.density];
  const textSizeClass = { small: "text-xs", medium: "text-sm", large: "text-base" }[value.textSize];
  const accentHex = { blue: "#2563eb", purple: "#7c3aed", teal: "#14b8a6", green: "#059669", orange: "#f59e0b" }[value.accent];

  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Тема</h3>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = value.theme === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onChange({ theme: option.key })}
                aria-pressed={isActive}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  isActive
                    ? "border-blue-300 bg-blue-50/60 dark:border-blue-500/50 dark:bg-blue-500/10"
                    : "border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-lg border",
                    option.key === "dark"
                      ? "border-gray-700 bg-gray-900"
                      : option.key === "light"
                        ? "border-gray-200 bg-white"
                        : "border-gray-300 bg-gradient-to-r from-white to-gray-900",
                  )}
                >
                  <Icon size={16} className={option.key === "light" ? "text-gray-400" : "text-gray-300"} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">{option.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Акцентный цвет</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {ACCENT_OPTIONS.map((accent) => (
            <button
              key={accent.key}
              type="button"
              onClick={() => onChange({ accent: accent.key })}
              aria-pressed={value.accent === accent.key}
              aria-label={accent.label}
              title={accent.label}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 transition-all dark:ring-offset-gray-900",
                value.accent === accent.key && "ring-2 ring-gray-300 dark:ring-gray-600",
              )}
            >
              <span className={cn("h-6 w-6 rounded-full", accent.swatch)} />
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={settingsCard}>
          <h3 className={settingsSectionTitle}>Плотность интерфейса</h3>
          <div className="mt-3 flex flex-col gap-1.5">
            {DENSITY_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onChange({ density: option.key })}
                aria-pressed={value.density === option.key}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  value.density === option.key
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className={settingsCard}>
          <h3 className={settingsSectionTitle}>Размер текста</h3>
          <div className="mt-3 flex flex-col gap-1.5">
            {TEXT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => onChange({ textSize: option.key })}
                aria-pressed={value.textSize === option.key}
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  value.textSize === option.key
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Живое превью</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Изменится после сохранения на всех страницах</p>
        <div
          className={cn(
            "mt-3 rounded-xl border transition-colors",
            densityPadding,
            previewIsDark ? "border-gray-700 bg-gray-950" : "border-gray-100 bg-[#FAFAFA]",
          )}
        >
          <div className={cn("flex items-center justify-between rounded-xl border p-3", previewIsDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white")}>
            <div>
              <p className={cn("font-medium", textSizeClass, previewIsDark ? "text-gray-50" : "text-gray-900")}>Выполнено задач</p>
              <p className={cn("mt-1 font-semibold", value.textSize === "large" ? "text-2xl" : value.textSize === "small" ? "text-lg" : "text-xl", previewIsDark ? "text-gray-50" : "text-gray-900")}>
                42
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${accentHex}1a` }}>
              <Bell size={16} style={{ color: accentHex }} />
            </div>
          </div>
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Боковая панель</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          <Switch checked={value.sidebarShowLabels} onChange={(c) => onChange({ sidebarShowLabels: c })} label="Показывать подписи иконок" />
          <Switch checked={value.sidebarAutoCollapse} onChange={(c) => onChange({ sidebarAutoCollapse: c })} label="Сворачивать sidebar автоматически" />
          <Switch checked={value.sidebarShowCounts} onChange={(c) => onChange({ sidebarShowCounts: c })} label="Показывать количество элементов" />
          <Switch checked={value.sidebarPinProfile} onChange={(c) => onChange({ sidebarPinProfile: c })} label="Закреплять профиль внизу" />
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Анимации</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          <Switch checked={value.animationsEnabled} onChange={(c) => onChange({ animationsEnabled: c })} label="Включить анимации интерфейса" />
          <Switch checked={value.reduceMotion} onChange={(c) => onChange({ reduceMotion: c })} label="Уменьшить движение" />
          <Switch checked={value.cardAppearAnimation} onChange={(c) => onChange({ cardAppearAnimation: c })} label="Анимация появления карточек" />
        </div>
      </section>
    </div>
  );
}

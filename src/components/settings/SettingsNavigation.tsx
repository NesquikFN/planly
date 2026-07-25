"use client";

import { LogOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETTINGS_CATEGORIES } from "@/lib/settings-defaults";
import type { SettingsCategoryKey } from "@/types/settings";

interface SettingsNavigationProps {
  active: SettingsCategoryKey;
  onSelect: (key: SettingsCategoryKey) => void;
  onResetSettings: () => void;
  onLogout: () => void;
}

export function SettingsNavigation({ active, onSelect, onResetSettings, onLogout }: SettingsNavigationProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-64">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-50">Настройки</h1>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Управление аккаунтом и приложением</p>

        <nav className="mt-4 space-y-1">
          {SETTINGS_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = active === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => onSelect(category.key)}
                aria-pressed={isActive}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{category.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={onResetSettings}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <RotateCcw size={16} />
          Сбросить настройки
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50/60 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <LogOut size={16} />
          Выйти из аккаунта
        </button>
      </div>
    </aside>
  );
}

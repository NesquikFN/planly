"use client";

import { CalendarPlus, Download, KeyRound, Sparkles } from "lucide-react";
import type { SettingsState } from "@/types/settings";

interface SettingsAsideProps {
  settings: SettingsState;
  sessionCount: number;
  onChangePassword: () => void;
  onExportData: () => void;
  onConnectCalendar: () => void;
  onUpgradePlan: () => void;
}

export function SettingsAside({ settings, sessionCount, onChangePassword, onExportData, onConnectCalendar, onUpgradePlan }: SettingsAsideProps) {
  const quickActions = [
    { key: "password", label: "Изменить пароль", icon: KeyRound, onClick: onChangePassword },
    { key: "export", label: "Экспортировать данные", icon: Download, onClick: onExportData },
    { key: "calendar", label: "Подключить календарь", icon: CalendarPlus, onClick: onConnectCalendar },
    { key: "upgrade", label: "Обновить тариф", icon: Sparkles, onClick: onUpgradePlan },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-72 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Аккаунт</h3>
        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-50">{settings.profile.displayName}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Free Plan</p>
        <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">{settings.profile.email}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Синхронизировано
        </p>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Безопасность</h3>
        <div className="mt-2 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <p>Пароль установлен</p>
          <p>2FA не включена</p>
          <p>{sessionCount} активных сеанса</p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Хранилище</h3>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Использовано 420 MB из 1 GB</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="h-full rounded-full bg-blue-600" style={{ width: "41%" }} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Быстрые действия</h3>
        <div className="mt-2 space-y-1">
          {quickActions.map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

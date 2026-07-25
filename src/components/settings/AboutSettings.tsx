"use client";

import { FileText, HelpCircle, MessageSquarePlus, RefreshCw, ScrollText, Shield } from "lucide-react";
import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";

interface AboutSettingsProps {
  onCheckUpdates: () => void;
  onStub: (message: string) => void;
}

const LINKS = [
  { key: "changelog", label: "Список изменений", icon: ScrollText },
  { key: "privacy-policy", label: "Политика конфиденциальности", icon: Shield },
  { key: "terms", label: "Условия использования", icon: FileText },
  { key: "licenses", label: "Лицензии", icon: FileText },
  { key: "help", label: "Центр помощи", icon: HelpCircle },
  { key: "bug", label: "Сообщить об ошибке", icon: MessageSquarePlus },
  { key: "feature", label: "Предложить улучшение", icon: MessageSquarePlus },
];

export function AboutSettings({ onCheckUpdates, onStub }: AboutSettingsProps) {
  return (
    <div className="space-y-6">
      <section className={cn(settingsCard, "text-center")}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-semibold text-white">
          P
        </div>
        <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-50">Planly</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Самый простой AI-планировщик</p>

        <div className="mx-auto mt-4 flex max-w-xs items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Версия</span>
          <span className="font-medium text-gray-900 dark:text-gray-50">1.0.0</span>
        </div>
        <div className="mx-auto flex max-w-xs items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Сборка</span>
          <span className="font-medium text-gray-900 dark:text-gray-50">2026.07.24</span>
        </div>

        <button
          type="button"
          onClick={onCheckUpdates}
          className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw size={14} />
          Проверить обновления
        </button>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Ссылки</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          {LINKS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onStub(`«${label}» появится в одном из следующих обновлений.`)}
              className="flex w-full items-center gap-2.5 py-2.5 text-left text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            >
              <Icon size={15} className="text-gray-400 dark:text-gray-500" />
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

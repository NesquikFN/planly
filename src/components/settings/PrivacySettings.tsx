"use client";

import { Eye } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { PrivacySettings as PrivacySettingsData } from "@/types/settings";

const VISIBILITY_OPTIONS: { key: PrivacySettingsData["visibility"]; label: string }[] = [
  { key: "onlyMe", label: "Только я" },
  { key: "projectMembers", label: "Участники моих проектов" },
  { key: "allContacts", label: "Все приглашённые контакты" },
];

interface PrivacySettingsProps {
  value: PrivacySettingsData;
  onChange: (patch: Partial<PrivacySettingsData>) => void;
  onViewData: () => void;
}

export function PrivacySettings({ value, onChange, onViewData }: PrivacySettingsProps) {
  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Приватность</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          <Switch checked={value.showActivityStatus} onChange={(c) => onChange({ showActivityStatus: c })} label="Показывать статус активности" />
          <Switch checked={value.showLastSeen} onChange={(c) => onChange({ showLastSeen: c })} label="Показывать время последнего посещения" />
          <Switch checked={value.searchableByEmail} onChange={(c) => onChange({ searchableByEmail: c })} label="Разрешать поиск профиля по email" />
          <Switch checked={value.allowInvitesFromOthers} onChange={(c) => onChange({ allowInvitesFromOthers: c })} label="Разрешать приглашения от других пользователей" />
          <Switch checked={value.sendAnonymousStats} onChange={(c) => onChange({ sendAnonymousStats: c })} label="Отправлять анонимную статистику использования" />
          <Switch checked={value.useDataForRecommendations} onChange={(c) => onChange({ useDataForRecommendations: c })} label="Использовать данные для персональных рекомендаций" />
          <Switch checked={value.showAchievementsToOthers} onChange={(c) => onChange({ showAchievementsToOthers: c })} label="Показывать достижения другим пользователям" />
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Кто может видеть мои данные</h3>
        <div className="mt-3 flex flex-col gap-1.5">
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange({ visibility: option.key })}
              aria-pressed={value.visibility === option.key}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                value.visibility === option.key
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onViewData}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Eye size={14} />
          Посмотреть, какие данные хранит Planly
        </button>
      </section>
    </div>
  );
}

"use client";

import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { PresenceStatus, ProfileSettings as ProfileSettingsData } from "@/types/settings";

const STATUS_OPTIONS: { key: PresenceStatus; label: string; dot: string }[] = [
  { key: "available", label: "Доступен", dot: "bg-emerald-500" },
  { key: "busy", label: "Занят", dot: "bg-amber-500" },
  { key: "doNotDisturb", label: "Не беспокоить", dot: "bg-red-500" },
  { key: "away", label: "Отошёл", dot: "bg-gray-400" },
];

const BIO_MAX_LENGTH = 200;

interface ProfileSettingsProps {
  value: ProfileSettingsData;
  onChange: (patch: Partial<ProfileSettingsData>) => void;
  onStub: (message: string) => void;
}

export function ProfileSettings({ value, onChange, onStub }: ProfileSettingsProps) {
  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <div className="flex items-center gap-4">
          <Avatar name={value.displayName} size={64} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">{value.displayName}</p>
            <p className="truncate text-sm text-gray-400 dark:text-gray-500">{value.email}</p>
            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Free Plan
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onStub("Загрузка фото профиля появится в одном из следующих обновлений.")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Camera size={13} />
              Изменить фото
            </button>
            <button
              type="button"
              onClick={() => onStub("Удаление фото профиля появится в одном из следующих обновлений.")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Trash2 size={13} />
              Удалить фото
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Имя</span>
            <input value={value.firstName} onChange={(e) => onChange({ firstName: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Фамилия</span>
            <input value={value.lastName} onChange={(e) => onChange({ lastName: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Отображаемое имя</span>
            <input value={value.displayName} onChange={(e) => onChange({ displayName: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Email</span>
            <input type="email" value={value.email} onChange={(e) => onChange({ email: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Телефон</span>
            <input value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Должность</span>
            <input value={value.jobTitle} onChange={(e) => onChange({ jobTitle: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Компания</span>
            <input value={value.company} onChange={(e) => onChange({ company: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Часовой пояс</span>
            <select value={value.timezone} onChange={(e) => onChange({ timezone: e.target.value })} className={settingsInput}>
              {["GMT+4 (Тбилиси)", "GMT+3 (Москва)", "GMT+1 (Берлин)", "GMT+0 (Лондон)"].map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className={settingsLabel}>Кратко о себе</span>
          <textarea
            value={value.bio}
            maxLength={BIO_MAX_LENGTH}
            onChange={(e) => onChange({ bio: e.target.value })}
            rows={3}
            className={cn(settingsInput, "resize-none")}
          />
          <span className="mt-1 block text-right text-xs text-gray-400 dark:text-gray-500">
            {value.bio.length} / {BIO_MAX_LENGTH}
          </span>
        </label>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Контактные данные</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          <Switch checked={value.showEmail} onChange={(checked) => onChange({ showEmail: checked })} label="Показывать email в профиле" />
          <Switch checked={value.showPhone} onChange={(checked) => onChange({ showPhone: checked })} label="Показывать телефон" />
          <Switch
            checked={value.allowProjectInvites}
            onChange={(checked) => onChange({ allowProjectInvites: checked })}
            label="Разрешить приглашения в проекты"
          />
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Статус</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.key}
              type="button"
              onClick={() => onChange({ status: status.key })}
              aria-pressed={value.status === status.key}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                value.status === status.key
                  ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400"
                  : "border-gray-100 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", status.dot)} />
              {status.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

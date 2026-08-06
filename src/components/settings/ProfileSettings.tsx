"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Info, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { getInitials, useProfileStore } from "@/hooks/useProfileStore";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/types/settings";

// One profile, one save button: name/phone/company/bio/timezone/language/
// avatar all live in the Supabase `profiles` row (source of truth, see
// useProfileStore); a few fields without a cloud column yet (visibility
// toggles, presence) stay local but are edited and saved right alongside it.

const STATUS_OPTIONS: { key: PresenceStatus; label: string; dot: string }[] = [
  { key: "available", label: "Доступен", dot: "bg-emerald-500" },
  { key: "busy", label: "Занят", dot: "bg-amber-500" },
  { key: "doNotDisturb", label: "Не беспокоить", dot: "bg-red-500" },
  { key: "away", label: "Отошёл", dot: "bg-gray-400" },
];

const BIO_MAX_LENGTH = 200;
const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

export function ProfileSettings() {
  const { draft, isDirty, isSaving, saveError, updateDraft, save, cancel } = useProfileStore();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Выберите файл изображения.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Файл слишком большой. Максимальный размер — 1.5 МБ.");
      return;
    }

    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateDraft({ avatarDataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Профиль"
        description="Управляйте личными данными и настройками аккаунта"
        isDirty={isDirty}
        isSaving={isSaving}
        onCancel={cancel}
        onSave={save}
      />

      {saveError && <p className="text-xs font-medium text-red-500 dark:text-red-400">{saveError}</p>}

      <p className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-ink-faint">
        <Info size={13} className="mt-0.5 shrink-0" />
        Данные этого устройства привязаны к аккаунту. Облачная синхронизация рабочих данных будет подключена следующим этапом.
      </p>

      <section className={settingsCard}>
        <div className="flex items-center gap-4">
          <Avatar name={draft.displayName} initials={getInitials(draft)} src={draft.avatarDataUrl} size={64} />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-900 dark:text-ink">{draft.displayName}</p>
            <p className="truncate text-sm text-gray-400 dark:text-ink-faint">{draft.email}</p>
            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-surface-2 dark:text-ink-faint">
              Free Plan
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
            >
              <Camera size={13} />
              Изменить фото
            </button>
            <button
              type="button"
              onClick={() => {
                setAvatarError(null);
                updateDraft({ avatarDataUrl: null });
              }}
              disabled={!draft.avatarDataUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/8 dark:text-ink-faint dark:hover:bg-surface-2"
            >
              <Trash2 size={13} />
              Удалить фото
            </button>
          </div>
        </div>
        {avatarError && <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">{avatarError}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Имя</span>
            <input value={draft.firstName} onChange={(e) => updateDraft({ firstName: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Фамилия</span>
            <input value={draft.lastName} onChange={(e) => updateDraft({ lastName: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Отображаемое имя</span>
            <input value={draft.displayName} onChange={(e) => updateDraft({ displayName: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Email</span>
            <input type="email" value={draft.email} disabled className={cn(settingsInput, "opacity-60")} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Телефон</span>
            <input value={draft.phone} onChange={(e) => updateDraft({ phone: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Должность</span>
            <input value={draft.jobTitle} onChange={(e) => updateDraft({ jobTitle: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Компания</span>
            <input value={draft.company} onChange={(e) => updateDraft({ company: e.target.value })} className={settingsInput} />
          </label>
          <label className="block">
            <span className={settingsLabel}>Часовой пояс</span>
            <select value={draft.timezone} onChange={(e) => updateDraft({ timezone: e.target.value })} className={settingsInput}>
              {["GMT+4 (Тбилиси)", "GMT+3 (Москва)", "GMT+1 (Берлин)", "GMT+0 (Лондон)"].map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Язык</span>
            <select value={draft.language} onChange={(e) => updateDraft({ language: e.target.value })} className={settingsInput}>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className={settingsLabel}>Кратко о себе</span>
          <textarea
            value={draft.bio}
            maxLength={BIO_MAX_LENGTH}
            onChange={(e) => updateDraft({ bio: e.target.value })}
            rows={3}
            className={cn(settingsInput, "resize-none")}
          />
          <span className="mt-1 block text-right text-xs text-gray-400 dark:text-ink-faint">
            {draft.bio.length} / {BIO_MAX_LENGTH}
          </span>
        </label>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Контактные данные</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-white/8">
          <Switch checked={draft.showEmail} onChange={(checked) => updateDraft({ showEmail: checked })} label="Показывать email в профиле" />
          <Switch checked={draft.showPhone} onChange={(checked) => updateDraft({ showPhone: checked })} label="Показывать телефон" />
          <Switch
            checked={draft.allowProjectInvites}
            onChange={(checked) => updateDraft({ allowProjectInvites: checked })}
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
              onClick={() => updateDraft({ status: status.key })}
              aria-pressed={draft.status === status.key}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                draft.status === status.key
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-gray-100 text-gray-500 hover:bg-gray-50 dark:border-white/8 dark:text-ink-faint dark:hover:bg-surface-2",
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

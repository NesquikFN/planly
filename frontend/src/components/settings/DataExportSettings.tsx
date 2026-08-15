"use client";

import { useState } from "react";
import { Download, Upload, X } from "lucide-react";
import { DangerZone, DangerZoneItem } from "@/components/settings/DangerZone";
import { Switch } from "@/components/ui/Switch";
import { settingsCard, settingsInput, settingsLabel, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { BackupSettings } from "@/types/settings";

const DATA_TYPES = ["Проекты", "Задачи", "Заметки", "Напоминания", "Календарь", "Аналитика"];
const FORMATS = ["JSON", "CSV", "PDF", "ZIP"];

interface DataExportSettingsProps {
  backup: BackupSettings;
  onBackupChange: (patch: Partial<BackupSettings>) => void;
  onCreateExport: (types: string[], format: string) => void;
  onCreateBackupNow: () => void;
  onImport: () => void;
}

export function DataExportSettings({ backup, onBackupChange, onCreateExport, onCreateBackupNow, onImport }: DataExportSettingsProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(DATA_TYPES);
  const [format, setFormat] = useState("JSON");
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  function toggleType(type: string) {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function requestConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirmAction({ title, message, onConfirm });
  }

  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Экспорт данных</h3>
        <div className="mt-3">
          <span className={settingsLabel}>Что экспортировать</span>
          <div className="flex flex-wrap gap-2">
            {DATA_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={selectedTypes.includes(type)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedTypes.includes(type)
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-gray-100 text-gray-500 hover:bg-gray-50 dark:border-white/8 dark:text-ink-faint dark:hover:bg-surface-2",
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <span className={settingsLabel}>Формат</span>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                aria-pressed={format === item}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  format === item
                    ? "bg-gray-900 text-white dark:bg-ink dark:text-canvas"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-surface-2 dark:text-ink-faint dark:hover:bg-surface-2",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-ink-faint">Последний экспорт: 20 июля 2026</p>
          <button
            type="button"
            onClick={() => onCreateExport(selectedTypes, format)}
            disabled={selectedTypes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} />
            Создать экспорт
          </button>
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Резервное копирование</h3>
        <div className="mt-2">
          <Switch checked={backup.autoBackup} onChange={(c) => onBackupChange({ autoBackup: c })} label="Автоматическое резервное копирование" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className="block">
            <span className={settingsLabel}>Частота</span>
            <select value={backup.frequency} onChange={(e) => onBackupChange({ frequency: e.target.value as BackupSettings["frequency"] })} className={settingsInput}>
              <option value="daily">Ежедневно</option>
              <option value="weekly">Еженедельно</option>
              <option value="monthly">Ежемесячно</option>
            </select>
          </label>
          <label className="block">
            <span className={settingsLabel}>Хранилище</span>
            <select value={backup.storage} onChange={(e) => onBackupChange({ storage: e.target.value as BackupSettings["storage"] })} className={settingsInput}>
              <option value="local">Локально</option>
              <option value="googleDrive">Google Drive</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-ink-faint">Последняя копия: {backup.lastBackupLabel}</p>
          <button
            type="button"
            onClick={onCreateBackupNow}
            className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
          >
            Создать резервную копию сейчас
          </button>
        </div>
      </section>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>Импорт</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-ink-faint">Импортировать данные из JSON или CSV</p>
        <div
          onClick={onImport}
          className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center hover:bg-gray-50 dark:border-white/8 dark:hover:bg-surface-2"
        >
          <Upload size={22} className="text-gray-300 dark:text-ink-faint" />
          <p className="text-sm text-gray-500 dark:text-ink-faint">Перетащите файл сюда или</p>
          <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/8 dark:text-ink-dim">Выбрать файл</span>
        </div>
      </section>

      <DangerZone>
        <DangerZoneItem
          title="Очистить историю активности"
          description="Удалит журнал действий без возможности восстановления"
          actionLabel="Очистить"
          onAction={() => requestConfirm("Очистить историю активности?", "Журнал действий будет удалён без возможности восстановления.", () => {})}
        />
        <DangerZoneItem
          title="Удалить завершённые задачи"
          description="Удалит все задачи со статусом «Выполнено»"
          actionLabel="Удалить"
          onAction={() => requestConfirm("Удалить завершённые задачи?", "Все выполненные задачи будут удалены безвозвратно.", () => {})}
        />
        <DangerZoneItem
          title="Очистить корзину"
          description="Безвозвратно удалит содержимое корзины"
          actionLabel="Очистить"
          onAction={() => requestConfirm("Очистить корзину?", "Содержимое корзины будет удалено безвозвратно.", () => {})}
        />
        <DangerZoneItem
          title="Удалить аккаунт"
          description="Полностью удалит аккаунт и все связанные данные"
          actionLabel="Удалить аккаунт"
          onAction={() => setDeleteAccountOpen(true)}
        />
      </DangerZone>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setConfirmAction(null)} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface">
            <h3 className="text-base font-semibold text-gray-900 dark:text-ink">{confirmAction.title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-ink-faint">{confirmAction.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2">
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => {
              setDeleteAccountOpen(false);
              setDeleteConfirmText("");
            }}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-red-500 dark:text-red-400">Удаление аккаунта</h3>
              <button
                type="button"
                onClick={() => {
                  setDeleteAccountOpen(false);
                  setDeleteConfirmText("");
                }}
                aria-label="Закрыть"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-2"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-ink-faint">
              Это действие необратимо. Все ваши проекты, задачи, заметки и напоминания будут удалены. Чтобы продолжить, введите слово{" "}
              <span className="font-semibold text-gray-700 dark:text-ink-dim">УДАЛИТЬ</span>.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className={cn(settingsInput, "mt-3")}
              placeholder="УДАЛИТЬ"
            />
            <button
              type="button"
              disabled={deleteConfirmText.trim().toUpperCase() !== "УДАЛИТЬ"}
              onClick={() => {
                setDeleteAccountOpen(false);
                setDeleteConfirmText("");
                requestConfirm("Запрос отправлен", "В этом прототипе аккаунт не удаляется по-настоящему.", () => {});
              }}
              className="mt-4 w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Удалить аккаунт навсегда
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

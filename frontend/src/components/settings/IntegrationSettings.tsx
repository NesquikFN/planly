"use client";

import { RefreshCw } from "lucide-react";
import { INTEGRATIONS } from "@/lib/settings-defaults";
import { settingsCard } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { IntegrationConnection } from "@/types/settings";

interface IntegrationSettingsProps {
  value: Record<string, IntegrationConnection>;
  onToggle: (key: string) => void;
  onStub: (message: string) => void;
}

export function IntegrationSettings({ value, onToggle, onStub }: IntegrationSettingsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {INTEGRATIONS.map((integration) => {
        const Icon = integration.icon;
        const connected = value[integration.key]?.connected ?? false;

        return (
          <section key={integration.key} className={settingsCard}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-surface-2 dark:text-ink-faint">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-ink">{integration.name}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      connected
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-400 dark:bg-surface-2 dark:text-ink-faint",
                    )}
                  >
                    {connected ? "Подключено" : "Не подключено"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-ink-faint">{integration.description}</p>

                {connected && integration.lastSync && (
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400 dark:text-ink-faint">
                    <span>Синхронизация: {integration.lastSync}</span>
                    {integration.syncedData && <span>· {integration.syncedData}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {connected ? (
                <>
                  <button
                    type="button"
                    onClick={() => onStub(`Синхронизация «${integration.name}» запущена.`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
                  >
                    <RefreshCw size={12} />
                    Синхронизировать
                  </button>
                  <button
                    type="button"
                    onClick={() => onStub(`Настройки «${integration.name}» появятся в одном из следующих обновлений.`)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
                  >
                    Настроить
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(integration.key)}
                    className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Отключить
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggle(integration.key)}
                  className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
                >
                  Подключить
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

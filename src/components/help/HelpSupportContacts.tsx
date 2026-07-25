"use client";

import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { ServerStatusItem, SupportChannel } from "@/types/help";

interface HelpSupportContactsProps {
  channels: SupportChannel[];
  statusItems: ServerStatusItem[];
}

const statusDot: Record<ServerStatusItem["status"], string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-red-500",
};

const statusLabel: Record<ServerStatusItem["status"], string> = {
  operational: "Работает",
  degraded: "Сбои",
  outage: "Недоступен",
};

export function HelpSupportContacts({ channels, statusItems }: HelpSupportContactsProps) {
  const allOperational = statusItems.every((item) => item.status === "operational");

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className={settingsCard}>
        <h3 className={settingsSectionTitle}>Контакты поддержки</h3>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          {channels.map(({ key, label, value, href, icon: Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 py-2.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-50"
            >
              <Icon size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
              <span className="w-20 shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">{label}</span>
              <span className="truncate">{value}</span>
            </a>
          ))}
        </div>
      </div>

      <div className={settingsCard}>
        <div className="flex items-center justify-between">
          <h3 className={settingsSectionTitle}>Статус серверов</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              allOperational
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
            )}
          >
            {allOperational ? "Все системы работают" : "Есть неполадки"}
          </span>
        </div>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
          {statusItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2.5 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", statusDot[item.status])} aria-hidden="true" />
                {item.label}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{statusLabel[item.status]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

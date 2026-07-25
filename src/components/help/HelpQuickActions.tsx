"use client";

import { settingsSectionTitle } from "@/lib/settings-form-styles";
import type { HelpQuickAction } from "@/types/help";

interface HelpQuickActionsProps {
  actions: HelpQuickAction[];
  onAction: (action: HelpQuickAction) => void;
}

export function HelpQuickActions({ actions, onAction }: HelpQuickActionsProps) {
  return (
    <section>
      <h3 className={settingsSectionTitle}>Быстрые действия</h3>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction(action)}
              className="flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Icon size={20} />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-50">{action.title}</h4>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{action.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

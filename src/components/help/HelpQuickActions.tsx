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
      {actions.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500 dark:border-white/8 dark:text-ink-faint">Нет подходящих быстрых действий</p>
      ) : <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction(action)}
              className="flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-colors hover:border-accent/30 hover:bg-accent/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-white/8 dark:bg-surface"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon size={20} />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-gray-900 dark:text-ink">{action.title}</h4>
              <p className="mt-1 text-xs text-gray-400 dark:text-ink-faint">{action.description}</p>
            </button>
          );
        })}
      </div>}
    </section>
  );
}

"use client";

import { Check } from "lucide-react";
import { PLANS } from "@/lib/settings-defaults";
import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";

interface PlanSettingsProps {
  onSelectPlan: (planName: string) => void;
}

export function PlanSettings({ onSelectPlan }: PlanSettingsProps) {
  return (
    <div className="space-y-6">
      <section className={settingsCard}>
        <div className="flex items-center justify-between">
          <h3 className={settingsSectionTitle}>Текущий тариф</h3>
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">Free Plan</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Проекты", value: 6, max: 10 },
            { label: "Хранилище", value: 420, max: 1024, unit: "MB", maxLabel: "1 GB" },
            { label: "Интеграции", value: 1, max: 2 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600 dark:text-ink-dim">{item.label}</span>
                <span className="text-gray-400 dark:text-ink-faint">
                  {item.value} из {item.maxLabel ?? item.max}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(item.value / item.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 dark:text-ink-faint">
          <span>Доступ к аналитике: базовый</span>
          <span>История изменений: 7 дней</span>
          <span>Экспорт данных: доступен</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <section
            key={plan.key}
            className={cn(
              "flex flex-col rounded-2xl border p-5 shadow-sm",
              plan.recommended
                ? "border-accent/30 bg-accent/5"
                : "border-gray-100 bg-white dark:border-white/8 dark:bg-surface",
            )}
          >
            {plan.recommended && (
              <span className="mb-2 inline-block w-fit rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-white">Рекомендуем</span>
            )}
            <h3 className="text-base font-semibold text-gray-900 dark:text-ink">{plan.name}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-ink">{plan.price}</p>

            <ul className="mt-3 flex-1 space-y-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-600 dark:text-ink-dim">
                  <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
              {plan.limits.map((limit) => (
                <li key={limit} className="flex items-start gap-2 text-xs text-gray-400 dark:text-ink-faint">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300 dark:bg-white/20" />
                  {limit}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onSelectPlan(plan.name)}
              className={cn(
                "mt-4 rounded-lg px-4 py-2 text-sm font-medium",
                plan.recommended ? "bg-accent text-white hover:bg-accent/90" : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2",
              )}
            >
              {plan.key === "free" ? "Текущий план" : `Перейти на ${plan.name}`}
            </button>
          </section>
        ))}
      </div>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>История платежей</h3>
        <p className="mt-2 text-sm text-gray-400 dark:text-ink-faint">Платежей пока нет</p>
      </section>
    </div>
  );
}

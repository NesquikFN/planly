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
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">Free Plan</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Проекты", value: 6, max: 10 },
            { label: "Хранилище", value: 420, max: 1024, unit: "MB", maxLabel: "1 GB" },
            { label: "Интеграции", value: 1, max: 2 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="text-gray-400 dark:text-gray-500">
                  {item.value} из {item.maxLabel ?? item.max}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${(item.value / item.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
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
                ? "border-blue-200 bg-blue-50/40 dark:border-blue-500/40 dark:bg-blue-500/5"
                : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900",
            )}
          >
            {plan.recommended && (
              <span className="mb-2 inline-block w-fit rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-medium text-white">Рекомендуем</span>
            )}
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">{plan.name}</h3>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-50">{plan.price}</p>

            <ul className="mt-3 flex-1 space-y-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
              {plan.limits.map((limit) => (
                <li key={limit} className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
                  {limit}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onSelectPlan(plan.name)}
              className={cn(
                "mt-4 rounded-lg px-4 py-2 text-sm font-medium",
                plan.recommended ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
              )}
            >
              {plan.key === "free" ? "Текущий план" : `Перейти на ${plan.name}`}
            </button>
          </section>
        ))}
      </div>

      <section className={settingsCard}>
        <h3 className={settingsSectionTitle}>История платежей</h3>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Платежей пока нет</p>
      </section>
    </div>
  );
}

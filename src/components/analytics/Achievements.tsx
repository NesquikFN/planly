"use client";

import { Award, Flame, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/types/analytics";

const ICONS: Record<string, LucideIcon> = {
  "Продуктивная неделя": Zap,
  "Без просрочек": ShieldCheck,
  "Фокус-мастер": Award,
  Стабильность: Flame,
};

export function Achievements({ achievements }: { achievements: Achievement[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Ваши достижения</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {achievements.map((achievement) => {
          const Icon = ICONS[achievement.title] ?? Award;
          return (
            <div
              key={achievement.id}
              className={cn(
                "rounded-xl border p-3.5 transition-colors",
                achievement.earned
                  ? "border-blue-100 bg-blue-50/60 dark:border-blue-500/20 dark:bg-blue-500/10"
                  : "border-gray-100 bg-gray-50/60 opacity-70 dark:border-gray-800 dark:bg-gray-800/40",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  achievement.earned
                    ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                )}
              >
                <Icon size={16} />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-gray-900 dark:text-gray-50">{achievement.title}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{achievement.description}</p>
              {achievement.earned && achievement.note && (
                <p className="mt-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">{achievement.note}</p>
              )}
              {!achievement.earned && achievement.progressLabel && (
                <p className="mt-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">{achievement.progressLabel}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

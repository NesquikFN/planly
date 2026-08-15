"use client";

import { Award, CalendarCheck2, Flame, ShieldCheck, Sparkle, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/types/analytics";

const ICONS: Record<string, LucideIcon> = {
  "first-task": Sparkle,
  "ten-tasks": Award,
  "fifty-tasks": Trophy,
  "streak-3": Flame,
  "streak-7": Flame,
  "no-overdue": ShieldCheck,
};

export function Achievements({ achievements }: { achievements: Achievement[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
      <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Ваши достижения</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const Icon = ICONS[achievement.id] ?? CalendarCheck2;
          return (
            <div
              key={achievement.id}
              className={cn(
                "rounded-xl border p-3.5 transition-colors",
                achievement.earned
                  ? "border-accent/20 bg-accent/[0.06]"
                  : "border-gray-100 bg-gray-50/60 opacity-70 dark:border-white/8 dark:bg-surface-2/40",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  achievement.earned
                    ? "bg-white text-accent shadow-sm dark:bg-surface dark:shadow-none"
                    : "bg-gray-100 text-gray-400 dark:bg-surface-2 dark:text-ink-faint",
                )}
              >
                <Icon size={16} />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-gray-900 dark:text-ink">{achievement.title}</p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-ink-faint">{achievement.description}</p>
              {achievement.progressLabel && (
                <p className="mt-1.5 text-[11px] font-medium text-gray-400 dark:text-ink-faint">{achievement.progressLabel}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

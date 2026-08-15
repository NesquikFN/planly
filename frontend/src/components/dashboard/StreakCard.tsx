"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { useClock } from "@/hooks/useClock";
import { addDays, getLocalDateKey } from "@/lib/date-utils";
import { getStreakData, STREAK_UPDATED_EVENT, type StreakData } from "@/lib/streak";
import { cn } from "@/lib/utils";

const WEEKDAY_LETTERS = ["П", "В", "С", "Ч", "П", "С", "В"];

const PHRASES = [
  "Продолжайте в том же духе!",
  "Каждый день на счету.",
  "Маленькие шаги — большой результат.",
  "Так держать!",
];

function pickPhrase(streak: number): string {
  if (streak === 0) return "Выполните полезное действие сегодня, чтобы начать серию.";
  return PHRASES[streak % PHRASES.length];
}

const EMPTY_STREAK: StreakData = { currentStreak: 0, bestStreak: 0, lastActiveDate: null, activityDates: [] };

export function StreakCard() {
  const { today } = useClock();
  // Starts empty on the server/first paint (no localStorage there), then
  // hydrates from the real value — same pattern as the other dashboard stores.
  const [data, setData] = useState<StreakData>(EMPTY_STREAK);

  useEffect(() => {
    setData(getStreakData());
    function handleUpdate() {
      setData(getStreakData());
    }
    window.addEventListener(STREAK_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(STREAK_UPDATED_EVENT, handleUpdate);
  }, []);

  const activitySet = new Set(data.activityDates);
  const last7Days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Серия активности</h3>
        <div className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-ink-faint">
          <Trophy size={13} />
          Лучшая: {data.bestStreak}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xl font-bold text-gray-900 dark:text-ink">
        <Flame size={20} className={cn(data.currentStreak > 0 ? "text-orange-500 dark:text-accent" : "text-gray-300 dark:text-white/10")} />
        {data.currentStreak} {data.currentStreak === 1 ? "день" : "дней"} подряд
      </div>

      <div className="mt-3 flex justify-between gap-1">
        {last7Days.map((day, index) => {
          const key = getLocalDateKey(day);
          const active = activitySet.has(key);
          const isToday = index === 6;
          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-gray-400 dark:text-ink-faint">
                {WEEKDAY_LETTERS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                  active
                    ? "bg-orange-500 font-semibold text-white dark:bg-accent"
                    : isToday
                      ? "border border-dashed border-gray-300 text-gray-400 dark:border-white/20 dark:text-ink-faint"
                      : "bg-gray-100 text-gray-300 dark:bg-surface-2 dark:text-ink-faint",
                )}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-ink-faint">{pickPhrase(data.currentStreak)}</p>
    </section>
  );
}

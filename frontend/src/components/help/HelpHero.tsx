"use client";

import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { settingsCard } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";

interface HelpHeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const HelpHero = forwardRef<HTMLInputElement, HelpHeroProps>(function HelpHero(
  { searchQuery, onSearchChange },
  ref,
) {
  return (
    <section className={cn(settingsCard, "text-center")}>
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-ink">Помощь</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-400 dark:text-ink-faint">
        Найдите ответ в базе знаний Planly или свяжитесь с нашей поддержкой
      </p>

      <div className="relative mx-auto mt-4 max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-ink-faint" />
        <input
          ref={ref}
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по справке..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
        />
        {searchQuery && (
          <button type="button" onClick={() => onSearchChange("")} aria-label="Очистить поиск" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:hover:bg-surface-2 dark:hover:text-ink-dim">
            <X size={15} />
          </button>
        )}
      </div>
    </section>
  );
});

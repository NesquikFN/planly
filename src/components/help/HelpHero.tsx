"use client";

import { forwardRef } from "react";
import { Search } from "lucide-react";
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
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-50">Помощь</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-400 dark:text-gray-500">
        Найдите ответ в базе знаний Planly или свяжитесь с нашей поддержкой
      </p>

      <div className="relative mx-auto mt-4 max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          ref={ref}
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск по справке..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>
    </section>
  );
});

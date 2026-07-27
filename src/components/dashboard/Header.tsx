"use client";

import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useClock } from "@/hooks/useClock";
import { useTheme } from "@/hooks/useTheme";
import { useProfileStore } from "@/hooks/useProfileStore";
import { formatRussianDate, getGreeting } from "@/lib/date-utils";

interface HeaderProps {
  /** @deprecated Header now sources the live name from useProfileStore; kept optional so existing call sites don't need to change. */
  userName?: string;
  onMenuClick: () => void;
  /** Overrides the greeting block with a plain heading — used by pages other than Dashboard. */
  title?: string;
  /** When false, the search icon no longer opens the dashboard task-search input. */
  enableTaskSearch?: boolean;
  /** Called when the search icon is clicked while `enableTaskSearch` is false. */
  onSearchIconClick?: () => void;
}

export function Header({
  userName,
  onMenuClick,
  title,
  enableTaskSearch = true,
  onSearchIconClick,
}: HeaderProps) {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useTasksStore();
  const { now } = useClock();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfileStore();

  const displayName = profile.displayName || userName || "";
  const dateLabel = formatRussianDate(now);
  const greeting = getGreeting(now);

  const showTaskSearchInput = enableTaskSearch && searchOpen;

  return (
    <header className="flex items-center justify-between gap-4 px-4 pb-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Открыть меню"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Menu size={20} />
        </button>
        {showTaskSearchInput ? (
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Поиск задач..."
            className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        ) : title ? (
          <h1 className="truncate text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-50">{title}</h1>
        ) : (
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-50">
              {greeting}, {displayName}! 👋
            </h1>
            <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">{dateLabel}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
          onClick={toggleTheme}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 sm:flex dark:text-gray-500 dark:hover:bg-gray-800"
        >
          {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          type="button"
          aria-label={showTaskSearchInput ? "Закрыть поиск" : "Поиск"}
          onClick={() => {
            if (!enableTaskSearch) {
              onSearchIconClick?.();
              return;
            }
            if (searchOpen) setSearchQuery("");
            setSearchOpen(!searchOpen);
          }}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 sm:flex dark:text-gray-500 dark:hover:bg-gray-800"
        >
          {showTaskSearchInput ? <X size={18} /> : <Search size={18} />}
        </button>
        <NotificationsPanel />
      </div>
    </header>
  );
}

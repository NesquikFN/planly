"use client";

import { Bell, Menu, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useTasksStore } from "@/hooks/useTasksStore";

interface HeaderProps {
  userName: string;
  date: string;
  onMenuClick: () => void;
}

export function Header({ userName, date, onMenuClick }: HeaderProps) {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useTasksStore();

  return (
    <header className="flex items-center justify-between gap-4 px-4 pb-4 pt-6 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Открыть меню"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        {searchOpen ? (
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Поиск задач..."
            className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        ) : (
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-gray-900 sm:text-2xl">
              Доброе утро, {userName}! 👋
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">{date}</p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label={searchOpen ? "Закрыть поиск" : "Поиск"}
          onClick={() => {
            if (searchOpen) setSearchQuery("");
            setSearchOpen(!searchOpen);
          }}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 sm:flex"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>
        <button
          type="button"
          aria-label="Уведомления"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <Avatar name={userName} />
      </div>
    </header>
  );
}

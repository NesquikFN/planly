"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  Folder,
  HelpCircle,
  Home,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  StickyNote,
  Sun,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useTheme } from "@/hooks/useTheme";
import { useProfileStore, getInitials } from "@/hooks/useProfileStore";
import { useAuth } from "@/hooks/useAuth";
import { useClickOutside } from "@/hooks/useClickOutside";
import { Avatar } from "@/components/ui/Avatar";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { NotesFoldersPanel } from "@/components/notes/NotesFoldersPanel";
import type { CalendarColor } from "@/types/calendar";
import type { NoteFolderKey, NoteTagDef } from "@/types/note";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  onDashboard?: boolean;
}

const navItems: NavItem[] = [
  { label: "Главная", icon: Home, href: "/", onDashboard: true },
  { label: "Календарь", icon: Calendar, href: "/calendar" },
  { label: "Проекты", icon: Folder, href: "/projects" },
  { label: "Заметки", icon: StickyNote, href: "/notes" },
  { label: "Напоминания", icon: Bell, href: "/reminders" },
  { label: "Аналитика", icon: BarChart3, href: "/analytics" },
  { label: "Сообщество", icon: Users, href: "/community" },
];

const secondaryItems: NavItem[] = [
  { label: "Настройки", icon: Settings, href: "/settings" },
  { label: "Помощь", icon: HelpCircle, href: "/help" },
  { label: "Архив", icon: Archive, href: "/archive" },
];

interface NotesExtras {
  activeFolder: NoteFolderKey;
  onFolderChange: (folder: NoteFolderKey) => void;
  folderCounts: Record<NoteFolderKey, number>;
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  tagDefs: NoteTagDef[];
  tagCounts: Record<string, number>;
  onCreateTag: (label: string) => void;
  onRenameTag: (oldLabel: string, newLabel: string) => void;
  onDeleteTag: (label: string) => void;
  onRecolorTag: (label: string, color: CalendarColor) => void;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Only passed by the Notes page — renders the folders/tags block below the main nav. */
  notesExtras?: NotesExtras;
  /** Only passed by the Reminders page — renders the categories/type block below the main nav. */
}

export function Sidebar({ isOpen, onClose, notesExtras }: SidebarProps) {
  const { setView } = useTasksStore();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfileStore();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const accountName = profile.displayName || user?.email || "Пользователь";
  const accountEmail = user?.email ?? null;

  const [stubMessage, setStubMessage] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(userMenuRef, () => setUserMenuOpen(false), userMenuOpen);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col border-r border-gray-100 bg-white px-4 py-6 transition-[left] duration-200 ease-out lg:left-0 dark:border-white/8 dark:bg-panel",
          isOpen ? "left-0" : "left-[-16rem]",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <span className="text-lg font-semibold text-accent">Planly</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть меню"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 lg:hidden dark:hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-10 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.href) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.onDashboard) setView("dashboard");
                    if (pathname !== item.href) router.push(item.href!);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900 dark:bg-white/[0.06] dark:text-ink"
                      : "text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim",
                  )}
                >
                  <Icon size={18} className={isActive ? "text-accent" : undefined} />
                  {item.label}
                </button>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setStubMessage(`Раздел «${item.label}» пока в разработке.`)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim"
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {notesExtras && (
          <NotesFoldersPanel
            activeFolder={notesExtras.activeFolder}
            onFolderChange={notesExtras.onFolderChange}
            folderCounts={notesExtras.folderCounts}
            activeTag={notesExtras.activeTag}
            onTagChange={notesExtras.onTagChange}
            tagDefs={notesExtras.tagDefs}
            tagCounts={notesExtras.tagCounts}
            onCreateTag={notesExtras.onCreateTag}
            onRenameTag={notesExtras.onRenameTag}
            onDeleteTag={notesExtras.onDeleteTag}
            onRecolorTag={notesExtras.onRecolorTag}
          />
        )}

        </div>

        <div className="space-y-1 border-t border-gray-100 pt-4 dark:border-white/8">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.href) {
                    if (pathname !== item.href) router.push(item.href);
                    onClose();
                  } else {
                    setStubMessage(`Раздел «${item.label}» пока в разработке.`);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900 dark:bg-white/[0.06] dark:text-ink"
                    : "text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim",
                )}
              >
                <Icon size={18} className={isActive ? "text-accent" : undefined} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-1 border-t border-gray-100 pt-4 dark:border-white/8">
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim"
          >
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            <span className="flex-1 text-left">{theme === "dark" ? "Тёмная тема" : "Светлая тема"}</span>
          </button>
        </div>

        <div className="relative mt-4 border-t border-gray-100 pt-4 dark:border-white/8" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((value) => !value)}
            aria-expanded={userMenuOpen}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-surface-2"
          >
            <Avatar name={accountName} initials={getInitials(profile)} src={profile.avatarDataUrl} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-ink">{accountName}</p>
              <p className="truncate text-xs text-gray-400 dark:text-ink-faint">{accountEmail ?? "Бесплатный план"}</p>
            </div>
            <ChevronDown
              size={16}
              className={cn("shrink-0 text-gray-400 transition-transform dark:text-ink-faint", userMenuOpen && "rotate-180")}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute inset-x-2 bottom-full z-20 mb-2 rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:border-white/8 dark:bg-surface-2">
              {[
                { key: "profile", label: "Профиль", icon: User },
                { key: "plan", label: "Тариф", icon: Sparkles },
                { key: "logout", label: "Выйти", icon: LogOut },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    if (key === "profile") {
                      router.push("/settings?tab=profile");
                      return;
                    }
                    if (key === "logout") {
                      // Signs out of Supabase and clears only the auth-scope
                      // pointer — local tasks/projects/notes/settings for
                      // this (or any) account stay on disk untouched.
                      await signOut();
                      router.push("/login");
                      return;
                    }
                    setStubMessage(`Раздел «${label}» пока в разработке.`);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 dark:text-ink-dim dark:hover:bg-surface"
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <ComingSoonDialog
        open={stubMessage !== null}
        onClose={() => setStubMessage(null)}
        title="Скоро будет доступно"
        message={stubMessage ?? undefined}
      />
    </>
  );
}

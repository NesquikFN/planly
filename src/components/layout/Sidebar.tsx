"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Folder,
  HelpCircle,
  Home,
  Settings,
  StickyNote,
  Sun,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksStore, type DashboardView } from "@/hooks/useTasksStore";

interface NavItem {
  label: string;
  icon: LucideIcon;
  view?: DashboardView;
  href?: string;
}

const navItems: NavItem[] = [
  { label: "Главная", icon: Home, view: "dashboard" },
  { label: "Выполнено", icon: CheckCircle2, view: "completed" },
  { label: "Календарь", icon: Calendar, href: "/calendar" },
  { label: "Проекты", icon: Folder },
  { label: "Заметки", icon: StickyNote },
  { label: "Привычки", icon: Target },
  { label: "Аналитика", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { view, setView } = useTasksStore();
  const pathname = usePathname();
  const router = useRouter();

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
          "fixed inset-y-0 z-50 flex w-64 flex-col border-r border-gray-100 bg-white px-4 py-6 transition-[left] duration-200 ease-out lg:left-0",
          isOpen ? "left-0" : "-left-64",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <span className="text-lg font-semibold text-gray-900">Planly</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть меню"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.view) {
              const isActive = pathname === "/" && view === item.view;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setView(item.view!);
                    if (pathname !== "/") router.push("/");
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            }

            if (item.href) {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    router.push(item.href!);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            }

            return (
              <a
                key={item.label}
                href="#"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-gray-100 pt-4">
          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <Settings size={18} />
            Настройки
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <HelpCircle size={18} />
            Помощь
          </a>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <Sun size={18} />
            <span className="flex-1 text-left">Светлая тема</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

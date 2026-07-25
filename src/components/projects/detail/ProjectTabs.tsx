"use client";

import { cn } from "@/lib/utils";

export type ProjectTabKey = "overview" | "tasks" | "notes" | "files" | "activity" | "timeline" | "settings";

const TABS: { key: ProjectTabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "notes", label: "Notes" },
  { key: "files", label: "Files" },
  { key: "activity", label: "Activity" },
  { key: "timeline", label: "Timeline" },
  { key: "settings", label: "Settings" },
];

interface ProjectTabsProps {
  active: ProjectTabKey;
  onChange: (tab: ProjectTabKey) => void;
}

export function ProjectTabs({ active, onChange }: ProjectTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-100 dark:border-gray-800">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          aria-pressed={active === tab.key}
          className={cn(
            "shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { Bell, CheckCircle2, FileUp, MessageSquare, Pencil, RefreshCw, UserPlus, type LucideIcon } from "lucide-react";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { Project, ProjectActivityType } from "@/types/project";

const ACTIVITY_ICON: Record<ProjectActivityType, LucideIcon> = {
  created: Bell,
  statusChanged: RefreshCw,
  taskCompleted: CheckCircle2,
  memberAdded: UserPlus,
  fileUploaded: FileUp,
  commented: MessageSquare,
  updated: Pencil,
};

const ACTIVITY_TONE: Record<ProjectActivityType, string> = {
  created: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  statusChanged: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  taskCompleted: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  memberAdded: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  fileUploaded: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  commented: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  updated: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

interface ProjectActivityTabProps {
  project: Project;
}

export function ProjectActivityTab({ project }: ProjectActivityTabProps) {
  if (project.activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <Bell size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Пока нет активности</p>
      </div>
    );
  }

  return (
    <section className={projectCard}>
      <h3 className={projectSectionTitle}>История изменений</h3>
      <ul className="mt-4 space-y-5">
        {project.activity.map((entry, index) => {
          const Icon = ACTIVITY_ICON[entry.type];
          return (
            <li key={entry.id} className="relative flex gap-3">
              {index < project.activity.length - 1 && (
                <span
                  className="absolute left-4 top-9 h-[calc(100%-0.25rem)] w-px bg-gray-100 dark:bg-gray-800"
                  aria-hidden="true"
                />
              )}
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", ACTIVITY_TONE[entry.type])}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 pb-1 pt-1">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-gray-900 dark:text-gray-50">{entry.actor}</span> {entry.message}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{entry.timeLabel}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

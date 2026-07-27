"use client";

import { CalendarDays, ListChecks, MoreVertical, Star } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Avatar } from "@/components/ui/Avatar";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { PROJECT_PRIORITY_BADGE, PROJECT_PRIORITY_LABELS, PROJECT_STATUS_BADGE, PROJECT_STATUS_LABELS } from "@/lib/projects";
import { PROJECT_ICON_MAP } from "@/lib/projects-mock-data";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  variant: "grid" | "list";
  onOpen: (project: Project) => void;
  onToggleStar: (id: string) => void;
  onEdit: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onDeleteRequest: (project: Project) => void;
}

export function ProjectCard({
  project,
  variant,
  onOpen,
  onToggleStar,
  onEdit,
  onDuplicate,
  onDeleteRequest,
}: ProjectCardProps) {
  const Icon = PROJECT_ICON_MAP[project.iconKey];
  const styles = calendarColorStyles[project.color];

  const menuItems = [
    { key: "open", label: "Открыть", onSelect: () => onOpen(project) },
    { key: "rename", label: "Переименовать", onSelect: () => onEdit(project) },
    { key: "duplicate", label: "Дублировать", onSelect: () => onDuplicate(project) },
    { key: "delete", label: "Удалить", destructive: true, onSelect: () => onDeleteRequest(project) },
  ];

  const progressBar = (
    <div className="flex-1">
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={cn("h-1.5 rounded-full", styles.swatch)} style={{ width: `${project.progress}%` }} />
      </div>
    </div>
  );

  const starButton = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleStar(project.id);
      }}
      aria-pressed={project.starred}
      aria-label={project.starred ? "Убрать из избранного" : "Добавить в избранное"}
      className="shrink-0 rounded-lg p-1 text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800"
    >
      <Star size={16} className={project.starred ? "fill-amber-400 text-amber-400" : undefined} />
    </button>
  );

  const menuButton = (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu
        trigger={<MoreVertical size={16} />}
        triggerClassName="shrink-0 rounded-lg p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-gray-600 dark:hover:bg-gray-800"
        triggerAriaLabel="Действия с проектом"
        items={menuItems}
      />
    </div>
  );

  const statusBadge = (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", PROJECT_STATUS_BADGE[project.status])}>
      {PROJECT_STATUS_LABELS[project.status]}
    </span>
  );

  const priorityBadge = (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", PROJECT_PRIORITY_BADGE[project.priority])}>
      {PROJECT_PRIORITY_LABELS[project.priority]}
    </span>
  );

  const memberStack = project.members.length > 0 && (
    <div className="flex -space-x-2">
      {project.members.slice(0, 3).map((member) => (
        <div key={member.id} className="rounded-full ring-2 ring-white dark:ring-gray-900" title={member.name}>
          <Avatar name={member.name} size={24} />
        </div>
      ))}
      {project.members.length > 3 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500 ring-2 ring-white dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-900">
          +{project.members.length - 3}
        </div>
      )}
    </div>
  );

  if (variant === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(project)}
        onKeyDown={(event) => (event.key === "Enter" ? onOpen(project) : undefined)}
        className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
      >
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", styles.block)}>
          <Icon size={20} className={styles.text} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{project.name}</p>
            {statusBadge}
          </div>
          <p className="truncate text-xs text-gray-400 dark:text-gray-500">{project.description}</p>
        </div>

        <div className="hidden shrink-0 sm:block">{priorityBadge}</div>

        <div className="hidden w-40 shrink-0 items-center gap-2 sm:flex">
          {progressBar}
          <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
            {project.progress}%
          </span>
        </div>

        <div className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 md:flex dark:text-gray-500">
          <ListChecks size={14} />
          {project.tasksDone}/{project.tasksTotal}
        </div>

        <div className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 lg:flex dark:text-gray-500">
          <CalendarDays size={14} />
          {project.deadlineLabel}
        </div>

        <div className="hidden shrink-0 lg:block">{memberStack}</div>

        {starButton}
        {menuButton}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(event) => (event.key === "Enter" ? onOpen(project) : undefined)}
      className="flex cursor-pointer flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", styles.block)}>
          <Icon size={20} className={styles.text} />
        </div>
        <div className="flex items-center gap-1">
          {starButton}
          {menuButton}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {statusBadge}
        {priorityBadge}
      </div>

      <h3 className="mt-2 truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{project.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">{project.description}</p>

      <div className="mt-4 flex items-center gap-2">
        {progressBar}
        <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
          {project.progress}%
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span className="inline-flex items-center gap-1">
          <ListChecks size={14} />
          {project.tasksDone}/{project.tasksTotal} задач
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={14} />
          {project.deadlineLabel}
        </span>
      </div>

      {memberStack && <div className="mt-3 flex items-center justify-between">{memberStack}</div>}
    </div>
  );
}

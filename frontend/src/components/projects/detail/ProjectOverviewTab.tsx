"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, Circle, Eye, ListChecks, Pin, PlayCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProjectTeamCard } from "@/components/projects/detail/ProjectTeamCard";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useNotesStore } from "@/hooks/useNotesStore";
import { groupTasksByStatus, projectCard, projectSectionTitle } from "@/lib/projects";
import { extractPlainText } from "@/lib/notes";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";
import type { ProjectTabKey } from "@/components/projects/detail/ProjectTabs";

const MILESTONE_DOT: Record<string, string> = {
  done: "bg-emerald-500",
  current: "bg-accent",
  upcoming: "bg-gray-300 dark:bg-white/15",
};

const UPCOMING_LIMIT = 5;
const NOTES_LIMIT = 4;

interface ProjectOverviewTabProps {
  project: Project;
  onOpenTab: (tab: ProjectTabKey) => void;
}

export function ProjectOverviewTab({ project, onOpenTab }: ProjectOverviewTabProps) {
  const groups = groupTasksByStatus(project.tasks);
  const { events, openEditModal } = useCalendarStore();
  const { notes } = useNotesStore();

  const upcoming = [
    ...project.tasks
      .filter((task) => task.status !== "done" && task.dueDate)
      .map((task) => ({ kind: "task" as const, id: task.id, date: task.dueDate!, title: task.title })),
    ...events
      .filter((event) => event.projectId === project.id)
      .map((event) => ({ kind: "event" as const, id: event.id, date: event.date, title: event.title })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, UPCOMING_LIMIT);

  const pinnedNotes = notes
    .filter((note) => note.links.projectId === project.id && note.pinned && !note.archived)
    .slice(0, NOTES_LIMIT);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="To Do" value={groups.todo.length} icon={Circle} tone="gray" />
        <StatCard label="In Progress" value={groups.inProgress.length} icon={PlayCircle} tone="purple" />
        <StatCard label="Review" value={groups.review.length} icon={Eye} tone="amber" />
        <StatCard label="Done" value={groups.done.length} icon={CheckCircle2} tone="green" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpenTab("tasks")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Открыть все задачи →
        </button>
        <button
          type="button"
          onClick={() => onOpenTab("notes")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Открыть заметки →
        </button>
        <button
          type="button"
          onClick={() => onOpenTab("timeline")}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Открыть Timeline →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className={projectCard}>
            <h3 className={projectSectionTitle}>Ближайшее</h3>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400 dark:text-ink-faint">Нет ближайших задач и событий</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {upcoming.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => (item.kind === "event" ? openEditModal(item.id) : onOpenTab("tasks"))}
                      className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-2"
                    >
                      {item.kind === "task" ? (
                        <ListChecks size={14} className="shrink-0 text-gray-400 dark:text-ink-faint" />
                      ) : (
                        <CalendarClock size={14} className="shrink-0 text-gray-400 dark:text-ink-faint" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-ink-dim">{item.title}</span>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-ink-faint">{item.date}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={projectCard}>
            <h3 className={projectSectionTitle}>Недавняя активность</h3>
            {project.activity.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400 dark:text-ink-faint">Пока нет активности</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {project.activity.slice(0, 4).map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-white/20" />
                    <div className="min-w-0">
                      <p className="text-gray-600 dark:text-ink-dim">
                        <span className="font-medium text-gray-900 dark:text-ink">{entry.actor}</span> {entry.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-ink-faint">{entry.createdAt ? new Date(entry.createdAt).toLocaleString("ru-RU") : entry.timeLabel}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={projectCard}>
            <h3 className={projectSectionTitle}>Этапы проекта</h3>
            <ul className="mt-3 space-y-2.5">
              {project.milestones.map((milestone) => (
                <li key={milestone.id} className="flex items-center gap-2.5 text-sm">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", MILESTONE_DOT[milestone.status])} />
                  <span
                    className={cn(
                      "flex-1",
                      milestone.status === "upcoming" ? "text-gray-400 dark:text-ink-faint" : "text-gray-700 dark:text-ink-dim",
                    )}
                  >
                    {milestone.label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-ink-faint">{milestone.dateLabel}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <ProjectTeamCard project={project} />

          <section className={projectCard}>
            <h3 className={projectSectionTitle}>Закреплённые заметки</h3>
            {pinnedNotes.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400 dark:text-ink-faint">Нет закреплённых заметок</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {pinnedNotes.map((note) => (
                  <li key={note.id}>
                    <Link
                      href={`/notes?note=${note.id}`}
                      className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-surface-2"
                    >
                      <Pin size={13} className="shrink-0 text-gray-400 dark:text-ink-faint" />
                      <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-ink-dim">{note.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

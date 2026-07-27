"use client";

import { CheckCircle2, Circle, Eye, PlayCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProjectTeamCard } from "@/components/projects/detail/ProjectTeamCard";
import { groupTasksByStatus, projectCard, projectSectionTitle } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

const MILESTONE_DOT: Record<string, string> = {
  done: "bg-emerald-500",
  current: "bg-blue-500",
  upcoming: "bg-gray-300 dark:bg-gray-700",
};

interface ProjectOverviewTabProps {
  project: Project;
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const groups = groupTasksByStatus(project.tasks);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="To Do" value={groups.todo.length} icon={Circle} tone="gray" />
        <StatCard label="In Progress" value={groups.inProgress.length} icon={PlayCircle} tone="blue" />
        <StatCard label="Review" value={groups.review.length} icon={Eye} tone="amber" />
        <StatCard label="Done" value={groups.done.length} icon={CheckCircle2} tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className={projectCard}>
            <h3 className={projectSectionTitle}>Недавняя активность</h3>
            {project.activity.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Пока нет активности</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {project.activity.slice(0, 4).map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <div className="min-w-0">
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-gray-50">{entry.actor}</span> {entry.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString("ru-RU") : entry.timeLabel}</p>
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
                      milestone.status === "upcoming" ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200",
                    )}
                  >
                    {milestone.label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{milestone.dateLabel}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <ProjectTeamCard project={project} />
      </div>
    </div>
  );
}

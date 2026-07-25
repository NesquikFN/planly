"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectTimelineTabProps {
  project: Project;
}

export function ProjectTimelineTab({ project }: ProjectTimelineTabProps) {
  const milestones = project.milestones;

  return (
    <section className={projectCard}>
      <div className="flex items-center justify-between">
        <h3 className={projectSectionTitle}>Таймлайн проекта</h3>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{project.progress}% выполнено</span>
      </div>

      <div className="mt-8 overflow-x-auto pb-2">
        <div className="flex min-w-[600px] items-start">
          {milestones.map((milestone, index) => (
            <Fragment key={milestone.id}>
              <div className="flex w-28 shrink-0 flex-col items-center px-1">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    milestone.status === "done" && "border-emerald-500 bg-emerald-500 text-white",
                    milestone.status === "current" &&
                      "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
                    milestone.status === "upcoming" &&
                      "border-gray-200 bg-white text-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600",
                  )}
                >
                  {milestone.status === "done" ? <Check size={14} /> : index + 1}
                </div>
                <p
                  className={cn(
                    "mt-2 text-center text-xs font-medium",
                    milestone.status === "upcoming" ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200",
                  )}
                >
                  {milestone.label}
                </p>
                <p className="mt-0.5 text-center text-[11px] text-gray-400 dark:text-gray-500">{milestone.dateLabel}</p>
              </div>

              {index < milestones.length - 1 && (
                <div
                  className={cn("mt-4 h-0.5 flex-1", milestone.status === "done" ? "bg-emerald-500" : "bg-gray-100 dark:bg-gray-800")}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

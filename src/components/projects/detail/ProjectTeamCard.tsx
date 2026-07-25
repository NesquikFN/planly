"use client";

import { Avatar } from "@/components/ui/Avatar";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { ProjectMember } from "@/types/project";

function workloadTone(percent: number): string {
  if (percent >= 85) return "bg-red-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-emerald-500";
}

interface ProjectTeamCardProps {
  members: ProjectMember[];
}

export function ProjectTeamCard({ members }: ProjectTeamCardProps) {
  return (
    <section className={projectCard}>
      <h3 className={projectSectionTitle}>Команда</h3>
      <ul className="mt-3 space-y-4">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3">
            <Avatar name={member.name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                  {member.name}
                  {member.isOwner && <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">· Владелец</span>}
                </p>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{member.workloadPercent}%</span>
              </div>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">{member.role}</p>
              <div className="mt-1.5 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div className={cn("h-1 rounded-full", workloadTone(member.workloadPercent))} style={{ width: `${member.workloadPercent}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

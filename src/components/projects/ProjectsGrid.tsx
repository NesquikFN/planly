"use client";

import { FolderSearch } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/types/project";
import type { ProjectsViewMode } from "@/components/projects/ProjectsToolbar";

interface ProjectsGridProps {
  projects: Project[];
  viewMode: ProjectsViewMode;
  onToggleStar: (id: string) => void;
  onStubAction: (action: string, project: Project) => void;
}

export function ProjectsGrid({ projects, viewMode, onToggleStar, onStubAction }: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <FolderSearch size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Ничего не найдено</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Попробуйте изменить запрос поиска</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            variant="list"
            onToggleStar={onToggleStar}
            onStubAction={onStubAction}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          variant="grid"
          onToggleStar={onToggleStar}
          onStubAction={onStubAction}
        />
      ))}
    </div>
  );
}

"use client";

import { FolderSearch } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/types/project";
import type { ProjectsViewMode } from "@/components/projects/ProjectsToolbar";

interface ProjectsGridProps {
  projects: Project[];
  viewMode: ProjectsViewMode;
  onOpen: (project: Project) => void;
  onToggleStar: (id: string) => void;
  onEdit: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  onDeleteRequest: (project: Project) => void;
  onCreate: () => void;
  isFiltered: boolean;
}

export function ProjectsGrid({
  projects,
  viewMode,
  onOpen,
  onToggleStar,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onCreate,
  isFiltered,
}: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <FolderSearch size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
          {isFiltered ? "Ничего не найдено" : "Проектов пока нет"}
        </p>
        {isFiltered ? (
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Попробуйте изменить запрос или фильтры</p>
        ) : (
          <button type="button" onClick={onCreate} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Создать первый проект
          </button>
        )}
      </div>
    );
  }

  const cardProps = { onOpen, onToggleStar, onEdit, onDuplicate, onDeleteRequest };

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} variant="list" {...cardProps} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} variant="grid" {...cardProps} />
      ))}
    </div>
  );
}

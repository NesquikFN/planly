"use client";

import { StickyNote } from "lucide-react";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import type { Project } from "@/types/project";

interface ProjectNotesTabProps {
  project: Project;
}

export function ProjectNotesTab({ project }: ProjectNotesTabProps) {
  if (project.notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <StickyNote size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Заметок пока нет</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {project.notes.map((note) => (
        <section key={note.id} className={projectCard}>
          <h3 className={projectSectionTitle}>{note.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">{note.excerpt}</p>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Обновлено: {note.updatedLabel}</p>
        </section>
      ))}
    </div>
  );
}

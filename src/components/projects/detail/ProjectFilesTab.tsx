"use client";

import { Download, FileText, Paperclip } from "lucide-react";
import { projectCard, projectSectionTitle } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectFilesTabProps {
  project: Project;
}

export function ProjectFilesTab({ project }: ProjectFilesTabProps) {
  if (project.files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <Paperclip size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Файлов пока нет</p>
      </div>
    );
  }

  return (
    <section className={cn(projectCard, "p-0")}>
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className={projectSectionTitle}>Файлы проекта</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">{project.files.length}</span>
      </div>

      <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
        {project.files.map((file) => (
          <li key={file.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{file.name}</p>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                {file.typeLabel} · {file.sizeLabel} · Загрузил(а) {file.uploadedBy} · {file.uploadedAtLabel}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Скачать «${file.name}»`}
              className="shrink-0 rounded-lg p-2 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-400"
            >
              <Download size={15} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

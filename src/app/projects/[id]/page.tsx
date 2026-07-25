"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FolderX } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ProjectDetailHeader } from "@/components/projects/detail/ProjectDetailHeader";
import { ProjectTabs, type ProjectTabKey } from "@/components/projects/detail/ProjectTabs";
import { ProjectOverviewTab } from "@/components/projects/detail/ProjectOverviewTab";
import { ProjectKanbanBoard } from "@/components/projects/detail/ProjectKanbanBoard";
import { ProjectNotesTab } from "@/components/projects/detail/ProjectNotesTab";
import { ProjectFilesTab } from "@/components/projects/detail/ProjectFilesTab";
import { ProjectActivityTab } from "@/components/projects/detail/ProjectActivityTab";
import { ProjectTimelineTab } from "@/components/projects/detail/ProjectTimelineTab";
import { ProjectSettingsTab } from "@/components/projects/detail/ProjectSettingsTab";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectDeleteModal } from "@/components/projects/ProjectDeleteModal";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { useClock } from "@/hooks/useClock";
import { isProjectOverdue } from "@/lib/projects";
import { USER_NAME } from "@/lib/app-constants";
import type { Project } from "@/types/project";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { today } = useClock();
  const { getProjectById, updateProject, deleteProject, archiveProject, toggleStar, moveTask, addTask } = useProjectsStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectTabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const project = getProjectById(params.id);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-col lg:pl-64">
          <Header userName={USER_NAME} onMenuClick={() => setSidebarOpen(true)} title="Проект не найден" enableTaskSearch={false} />
          <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 pb-16 text-center">
            <FolderX size={32} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Такого проекта нет — возможно, он был удалён или перемещён в архив.
            </p>
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Вернуться к проектам
            </button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header userName={USER_NAME} onMenuClick={() => setSidebarOpen(true)} title={project.name} enableTaskSearch={false} />

        <main className="flex-1 space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
          <ProjectDetailHeader
            project={project}
            isOverdue={isProjectOverdue(project, today)}
            onBack={() => router.push("/projects")}
            onToggleStar={() => toggleStar(project.id)}
            onEdit={() => setEditOpen(true)}
            onDeleteRequest={() => setDeleteTarget(project)}
          />

          <ProjectTabs active={activeTab} onChange={setActiveTab} />

          {activeTab === "overview" && <ProjectOverviewTab project={project} />}
          {activeTab === "tasks" && (
            <ProjectKanbanBoard
              project={project}
              onMoveTask={(taskId, status) => moveTask(project.id, taskId, status)}
              onAddTask={(title) => addTask(project.id, title)}
            />
          )}
          {activeTab === "notes" && <ProjectNotesTab project={project} />}
          {activeTab === "files" && <ProjectFilesTab project={project} />}
          {activeTab === "activity" && <ProjectActivityTab project={project} />}
          {activeTab === "timeline" && <ProjectTimelineTab project={project} />}
          {activeTab === "settings" && (
            <ProjectSettingsTab
              project={project}
              onSave={(values) => updateProject(project.id, values)}
              onArchive={() => archiveProject(project.id)}
              onDeleteRequest={() => setDeleteTarget(project)}
            />
          )}
        </main>
      </div>

      <ProjectFormModal
        open={editOpen}
        mode="edit"
        initial={project}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => {
          updateProject(project.id, values);
          setEditOpen(false);
        }}
      />

      <ProjectDeleteModal
        project={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(target) => {
          deleteProject(target.id);
          setDeleteTarget(null);
          router.push("/projects");
        }}
      />
    </div>
  );
}

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
import { EventModal } from "@/components/calendar/EventModal";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useClock } from "@/hooks/useClock";
import { isProjectOverdue } from "@/lib/projects";
import { USER_NAME } from "@/lib/app-constants";
import type { Project } from "@/types/project";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { today } = useClock();
  const store = useProjectsStore();
  const { getProjectById, updateProject, deleteProject, toggleStar, moveTask, addTask, deleteTask, canEdit, currentRole, addTag, removeTag, logActivity } = store;
  const { events, openCreateModal, openEditModal } = useCalendarStore();

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
            onEdit={() => { if (canEdit(project)) setEditOpen(true); }}
            onDeleteRequest={() => { if (currentRole(project) === "Owner") setDeleteTarget(project); }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!canEdit(project)} onClick={() => setActiveTab("tasks")} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40">Новая задача</button>
            <button type="button" disabled={!canEdit(project)} onClick={() => openCreateModal({ project: project.name, projectId: project.id })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium dark:border-gray-700 disabled:opacity-40">Новое событие</button>
            <form onSubmit={(e) => { e.preventDefault(); const input = new FormData(e.currentTarget).get("tag")?.toString() ?? ""; if (addTag(project.id, input)) e.currentTarget.reset(); }} className="flex gap-1">
              <input name="tag" disabled={!canEdit(project)} placeholder="Новый тег" className="w-28 rounded-lg border border-gray-200 bg-transparent px-2 py-1.5 text-xs dark:border-gray-700"/>
              <button disabled={!canEdit(project)} className="rounded-lg bg-gray-100 px-2 text-xs dark:bg-gray-800">Добавить</button>
            </form>
            {project.tags.map(tag => <button key={tag} disabled={!canEdit(project)} onClick={() => removeTag(project.id, tag)} title="Удалить тег" className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">#{tag} ×</button>)}
          </div>

          <ProjectTabs active={activeTab} onChange={setActiveTab} />

          {activeTab === "overview" && <ProjectOverviewTab project={project} />}
          {activeTab === "tasks" && (
            <ProjectKanbanBoard
              project={project}
              onMoveTask={(taskId, status) => moveTask(project.id, taskId, status)}
              onAddTask={(title) => addTask(project.id, title)}
              onDeleteTask={(taskId, archive) => deleteTask(project.id, taskId, archive)}
              editable={canEdit(project)}
            />
          )}
          {activeTab === "notes" && <ProjectNotesTab project={project} />}
          {activeTab === "files" && <ProjectFilesTab project={project} />}
          {activeTab === "activity" && <ProjectActivityTab project={project} />}
          {activeTab === "timeline" && <ProjectTimelineTab project={project} />}
          {activeTab === "overview" && events.filter((event) => event.projectId === project.id).length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="font-semibold">События проекта</h3>
              <ul className="mt-2 space-y-2">{events.filter((event) => event.projectId === project.id).map(event => <li key={event.id}><button onClick={() => openEditModal(event.id)} className="text-sm text-blue-600">{event.date} · {event.title}</button></li>)}</ul>
            </section>
          )}
          {activeTab === "settings" && (
            <ProjectSettingsTab
              project={project}
              onSave={(values) => updateProject(project.id, values)}
              onDeleteRequest={() => { if (currentRole(project) === "Owner") setDeleteTarget(project); }}
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
      <EventModal onSaved={(mode, eventId) => logActivity(project.id, { actionType: mode === "create" ? "eventCreated" : "eventUpdated", message: mode === "create" ? "создал(а) связанное событие" : "изменил(а) связанное событие", entityType: "event", entityId: eventId })} />
    </div>
  );
}

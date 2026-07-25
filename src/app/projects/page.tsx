"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { ProjectsToolbar, type ProjectsViewMode } from "@/components/projects/ProjectsToolbar";
import { ProjectsStatsRow } from "@/components/projects/ProjectsStatsRow";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { ProjectsSidePanel } from "@/components/projects/ProjectsSidePanel";
import { ProjectsArchiveCard } from "@/components/projects/ProjectsArchiveCard";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectDeleteModal } from "@/components/projects/ProjectDeleteModal";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { useClock } from "@/hooks/useClock";
import { computeOverviewStats, filterProjects, getUniqueTags, sortProjects } from "@/lib/projects";
import { USER_NAME } from "@/lib/app-constants";
import type { Project, ProjectFormValues, ProjectPriority, ProjectStatus } from "@/types/project";

type FormModalState = { mode: "create" } | { mode: "edit"; project: Project };

export default function ProjectsPage() {
  const router = useRouter();
  const { today } = useClock();
  const { projects, createProject, updateProject, deleteProject, duplicateProject, archiveProject, restoreProject, toggleStar } =
    useProjectsStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ProjectsViewMode>("grid");
  const [sortLabel, setSortLabel] = useState("По названию");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [formModal, setFormModal] = useState<FormModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const archivedProjects = useMemo(() => projects.filter((project) => project.archived), [projects]);
  const tags = useMemo(() => getUniqueTags(projects.filter((project) => !project.archived)), [projects]);
  const stats = useMemo(() => computeOverviewStats(projects, today), [projects, today]);

  const visibleProjects = useMemo(() => {
    const filtered = filterProjects(projects, { search: searchQuery, status: statusFilter, priority: priorityFilter, tag: tagFilter });
    return sortProjects(filtered, sortLabel);
  }, [projects, searchQuery, statusFilter, priorityFilter, tagFilter, sortLabel]);

  function handleOpenProject(project: Project) {
    router.push(`/projects/${project.id}`);
  }

  function handleFormSubmit(values: ProjectFormValues) {
    if (formModal?.mode === "edit") {
      updateProject(formModal.project.id, values);
    } else {
      createProject(values);
    }
    setFormModal(null);
  }

  function handleConfirmDelete(project: Project) {
    deleteProject(project.id);
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header
          userName={USER_NAME}
          onMenuClick={() => setSidebarOpen(true)}
          title="Проекты"
          enableTaskSearch={false}
          onSearchIconClick={() => searchInputRef.current?.focus()}
        />

        <main className="flex-1 space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
          <ProjectsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortLabel={sortLabel}
            onSortLabelChange={setSortLabel}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            tags={tags}
            onNewProject={() => setFormModal({ mode: "create" })}
            searchInputRef={searchInputRef}
          />

          <ProjectsStatsRow {...stats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <ProjectsGrid
              projects={visibleProjects}
              viewMode={viewMode}
              onOpen={handleOpenProject}
              onToggleStar={toggleStar}
              onEdit={(project) => setFormModal({ mode: "edit", project })}
              onDuplicate={(project) => duplicateProject(project.id)}
              onArchive={(project) => archiveProject(project.id)}
              onDeleteRequest={setDeleteTarget}
            />
            <ProjectsSidePanel
              onQuickAction={(action) => {
                if (action === "Новый проект") {
                  setFormModal({ mode: "create" });
                  return;
                }
                setStubDialog({ title: "Скоро будет доступно", message: `«${action}» появится в одном из следующих обновлений.` });
              }}
            />
          </div>

          <ProjectsArchiveCard archivedProjects={archivedProjects} onRestore={restoreProject} onDeleteRequest={setDeleteTarget} />
        </main>
      </div>

      <ProjectFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? "create"}
        initial={formModal?.mode === "edit" ? formModal.project : null}
        onClose={() => setFormModal(null)}
        onSubmit={handleFormSubmit}
      />

      <ProjectDeleteModal project={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete} />

      <ComingSoonDialog
        open={stubDialog !== null}
        onClose={() => setStubDialog(null)}
        title={stubDialog?.title ?? ""}
        message={stubDialog?.message}
      />
    </div>
  );
}

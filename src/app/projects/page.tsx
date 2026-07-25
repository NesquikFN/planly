"use client";

import { useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { ProjectsToolbar, type ProjectsViewMode } from "@/components/projects/ProjectsToolbar";
import { ProjectsStatsRow } from "@/components/projects/ProjectsStatsRow";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { ProjectsSidePanel } from "@/components/projects/ProjectsSidePanel";
import { ProjectsArchiveCard } from "@/components/projects/ProjectsArchiveCard";
import { mockProjects } from "@/lib/projects-mock-data";
import { USER_NAME } from "@/lib/app-constants";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ProjectsViewMode>("grid");
  const [sortLabel, setSortLabel] = useState("По названию");
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === "active").length,
      completed: projects.filter((project) => project.status === "completed").length,
      onHold: projects.filter((project) => project.status === "onHold").length,
      archived: 0,
    }),
    [projects],
  );

  const visibleProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  function toggleStar(id: string) {
    setProjects((prev) =>
      prev.map((project) => (project.id === id ? { ...project, starred: !project.starred } : project)),
    );
  }

  function handleStubAction(action: string, project: Project) {
    setStubDialog({ title: "Скоро будет доступно", message: `«${action}» для проекта «${project.name}» появится позже.` });
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
            onNewProject={() =>
              setStubDialog({ title: "Скоро будет доступно", message: "Создание новых проектов появится в одном из следующих обновлений." })
            }
            searchInputRef={searchInputRef}
          />

          <ProjectsStatsRow {...stats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <ProjectsGrid
              projects={visibleProjects}
              viewMode={viewMode}
              onToggleStar={toggleStar}
              onStubAction={handleStubAction}
            />
            <ProjectsSidePanel
              onQuickAction={(action) =>
                setStubDialog({ title: "Скоро будет доступно", message: `«${action}» появится в одном из следующих обновлений.` })
              }
            />
          </div>

          <ProjectsArchiveCard
            onOpenArchive={() =>
              setStubDialog({ title: "Архив проектов", message: "Архив пока пуст — завершённые и неактивные проекты будут появляться здесь." })
            }
          />
        </main>
      </div>

      <ComingSoonDialog
        open={stubDialog !== null}
        onClose={() => setStubDialog(null)}
        title={stubDialog?.title ?? ""}
        message={stubDialog?.message}
      />
    </div>
  );
}

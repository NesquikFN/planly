"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Folder } from "lucide-react";
import { useClock } from "@/hooks/useClock";
import { createMockProjects } from "@/lib/projects-mock-data";
import { computeMilestoneStatus, formatProjectDateLabel } from "@/lib/projects";
import { fromISODate, formatShortDate } from "@/lib/date-utils";
import { USER_NAME } from "@/lib/app-constants";
import type { Project, ProjectFormValues, ProjectTask, ProjectTaskStatus } from "@/types/project";

// Context/Provider for the Projects domain — mirrors useTasksStore/useCalendarStore
// so the rest of the app stays consistent, but is mounted only in
// app/projects/layout.tsx (not the root layout), keeping it scoped to this
// module. In-memory only for now (mock data, no localStorage/API) — swapping
// createMockProjects() for a real fetch and adding persistence later shouldn't
// require touching any component, only this file.

const DEFAULT_MILESTONE_LABELS = ["Старт проекта", "Планирование и дизайн", "Разработка", "Тестирование", "Запуск"];

interface ProjectsStoreValue {
  projects: Project[];
  getProjectById: (id: string) => Project | undefined;
  createProject: (values: ProjectFormValues) => Project;
  updateProject: (id: string, values: ProjectFormValues) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  toggleStar: (id: string) => void;
  moveTask: (projectId: string, taskId: string, status: ProjectTaskStatus) => void;
  addTask: (projectId: string, title: string) => void;
}

const ProjectsContext = createContext<ProjectsStoreValue | null>(null);

function withRecomputedProgress(project: Project): Project {
  const tasksDone = project.tasks.filter((task) => task.status === "done").length;
  const tasksTotal = project.tasks.length;
  const progress =
    project.status === "completed" ? 100 : tasksTotal === 0 ? 0 : Math.round((tasksDone / tasksTotal) * 100);
  const milestones = project.milestones.map((milestone, index) => ({
    ...milestone,
    status: computeMilestoneStatus(index, project.milestones.length, progress),
  }));

  return { ...project, tasksDone, tasksTotal, progress, milestones };
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { today } = useClock();
  const [projects, setProjects] = useState<Project[]>(() => createMockProjects());

  const getProjectById = useCallback((id: string) => projects.find((project) => project.id === id), [projects]);

  const createProject = useCallback(
    (values: ProjectFormValues): Project => {
      const id = `p-${Date.now()}`;
      const tags = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const newProject: Project = {
        id,
        name: values.name.trim(),
        description: values.description.trim(),
        icon: Folder,
        color: values.color,
        status: values.status,
        priority: values.priority,
        progress: 0,
        tasksDone: 0,
        tasksTotal: 0,
        deadlineLabel: values.deadlineKey ? formatShortDate(fromISODate(values.deadlineKey)) : "—",
        deadlineKey: values.deadlineKey || null,
        createdAtLabel: formatProjectDateLabel(today),
        starred: false,
        archived: false,
        tags,
        members: [{ id: `${id}-owner`, name: USER_NAME, role: "Владелец", workloadPercent: 50, isOwner: true }],
        tasks: [],
        notes: [],
        files: [],
        activity: [
          {
            id: `${id}-a0`,
            type: "created",
            actor: USER_NAME,
            message: `создал(а) проект «${values.name.trim()}»`,
            timeLabel: "Только что",
          },
        ],
        milestones: DEFAULT_MILESTONE_LABELS.map((label, index) => ({
          id: `${id}-ms${index}`,
          label,
          dateLabel: "—",
          status: computeMilestoneStatus(index, DEFAULT_MILESTONE_LABELS.length, 0),
        })),
      };

      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    },
    [today],
  );

  const updateProject = useCallback((id: string, values: ProjectFormValues) => {
    const tags = values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== id) return project;
        const updated: Project = {
          ...project,
          name: values.name.trim(),
          description: values.description.trim(),
          color: values.color,
          status: values.status,
          priority: values.priority,
          deadlineKey: values.deadlineKey || null,
          deadlineLabel: values.deadlineKey ? formatShortDate(fromISODate(values.deadlineKey)) : "—",
          tags,
        };
        return withRecomputedProgress(updated);
      }),
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }, []);

  const duplicateProject = useCallback((id: string) => {
    setProjects((prev) => {
      const sourceIndex = prev.findIndex((project) => project.id === id);
      if (sourceIndex === -1) return prev;
      const source = prev[sourceIndex];
      const newId = `${source.id}-copy-${Date.now()}`;
      const clonedName = `${source.name} (копия)`;

      const clone: Project = {
        ...source,
        id: newId,
        name: clonedName,
        starred: false,
        archived: false,
        tasks: source.tasks.map((task, index) => ({ ...task, id: `${newId}-t${index}` })),
        notes: source.notes.map((note, index) => ({ ...note, id: `${newId}-n${index}` })),
        files: source.files.map((file, index) => ({ ...file, id: `${newId}-f${index}` })),
        milestones: source.milestones.map((milestone, index) => ({ ...milestone, id: `${newId}-ms${index}` })),
        activity: [
          {
            id: `${newId}-a0`,
            type: "created",
            actor: USER_NAME,
            message: `создал(а) проект «${clonedName}» из «${source.name}»`,
            timeLabel: "Только что",
          },
        ],
      };

      const next = [...prev];
      next.splice(sourceIndex + 1, 0, clone);
      return next;
    });
  }, []);

  const archiveProject = useCallback((id: string) => {
    setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, archived: true } : project)));
  }, []);

  const restoreProject = useCallback((id: string) => {
    setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, archived: false } : project)));
  }, []);

  const toggleStar = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((project) => (project.id === id ? { ...project, starred: !project.starred } : project)),
    );
  }, []);

  const moveTask = useCallback((projectId: string, taskId: string, status: ProjectTaskStatus) => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        const tasks = project.tasks.map((task) => (task.id === taskId ? { ...task, status } : task));
        return withRecomputedProgress({ ...project, tasks });
      }),
    );
  }, []);

  const addTask = useCallback((projectId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        const newTask: ProjectTask = {
          id: `${projectId}-t${Date.now()}`,
          title: trimmed,
          status: "todo",
          priority: "medium",
          assigneeId: null,
          dueLabel: null,
        };
        return withRecomputedProgress({ ...project, tasks: [...project.tasks, newTask] });
      }),
    );
  }, []);

  const value = useMemo<ProjectsStoreValue>(
    () => ({
      projects,
      getProjectById,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      archiveProject,
      restoreProject,
      toggleStar,
      moveTask,
      addTask,
    }),
    [
      projects,
      getProjectById,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      archiveProject,
      restoreProject,
      toggleStar,
      moveTask,
      addTask,
    ],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjectsStore(): ProjectsStoreValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjectsStore must be used within a ProjectsProvider");
  return ctx;
}

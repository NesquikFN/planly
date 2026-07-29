"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import { useProfileStore } from "@/hooks/useProfileStore";
import { computeMilestoneStatus, formatProjectDateLabel } from "@/lib/projects";
import { fromISODate, formatShortDate, toISODate, addDays, addMonths } from "@/lib/date-utils";
import { readStorage, writeStorage } from "@/lib/storage";
import { recordDailyActivity } from "@/lib/streak";
import type {
  Project, ProjectActivityEntry, ProjectActivityType, ProjectFormValues, ProjectMember,
  ProjectRole, ProjectTask, ProjectTaskStatus, ProjectTimeline, ProjectTimelinePreset,
} from "@/types/project";

const PROJECTS_STORAGE_KEY = "planly:projects";
const DEFAULT_MILESTONES = ["Старт проекта", "Планирование", "Работа", "Проверка", "Завершение"];

type ActivityInput = {
  actionType: ProjectActivityType; message: string;
  entityType?: ProjectActivityEntry["entityType"]; entityId?: string;
  metadata?: Record<string, unknown>;
};

interface ProjectsStoreValue {
  projects: Project[];
  getProjectById: (id: string) => Project | undefined;
  currentRole: (project: Project) => ProjectRole;
  canEdit: (project: Project) => boolean;
  canManageMembers: (project: Project) => boolean;
  createProject: (values: ProjectFormValues) => Project;
  updateProject: (id: string, values: ProjectFormValues) => boolean;
  deleteProject: (id: string) => boolean;
  restoreDeletedProject: (project: Project) => void;
  duplicateProject: (id: string) => void;
  archiveProject: (id: string) => void;
  restoreProject: (id: string) => void;
  toggleStar: (id: string) => void;
  moveTask: (projectId: string, taskId: string, status: ProjectTaskStatus) => boolean;
  addTask: (projectId: string, title: string) => ProjectTask | null;
  updateTask: (projectId: string, taskId: string, patch: Partial<ProjectTask>) => boolean;
  deleteTask: (projectId: string, taskId: string, archive?: boolean) => boolean;
  restoreArchivedTask: (projectId: string, task: ProjectTask) => boolean;
  addMember: (projectId: string, email: string) => boolean;
  removeMember: (projectId: string, memberId: string) => boolean;
  changeMemberRole: (projectId: string, memberId: string, role: ProjectRole) => boolean;
  setTimeline: (projectId: string, preset: ProjectTimelinePreset, startDate: string, endDate: string) => boolean;
  addTag: (projectId: string, tag: string) => boolean;
  removeTag: (projectId: string, tag: string) => boolean;
  renameTag: (projectId: string, oldTag: string, newTag: string) => boolean;
  logActivity: (projectId: string, input: ActivityInput) => void;
}

const ProjectsContext = createContext<ProjectsStoreValue | null>(null);
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function progress(project: Project): Project {
  const tasksDone = project.tasks.filter((task) => task.status === "done").length;
  const tasksTotal = project.tasks.length;
  const value = project.status === "completed" ? 100 : tasksTotal ? Math.round(tasksDone / tasksTotal * 100) : 0;
  return {
    ...project, tasksDone, tasksTotal, progress: value,
    milestones: project.milestones.map((m, i) => ({ ...m, status: computeMilestoneStatus(i, project.milestones.length, value) })),
  };
}

function normalize(project: Project, email: string, name: string): Project {
  const now = new Date();
  const owner: ProjectMember = {
    id: `${project.id}-owner`, email, displayName: name, name, role: "Owner",
    invitationStatus: "accepted", addedAt: now.toISOString(), workloadPercent: 0, isOwner: true,
  };
  const members = project.members?.length ? project.members.map((m, index) => ({
    ...m,
    email: m.email ?? (m.isOwner ? email : `member${index}@local.planly`),
    displayName: m.displayName ?? m.name,
    role: (m.isOwner ? "Owner" : (["Owner", "Editor", "Viewer"].includes(m.role) ? m.role : "Editor")) as ProjectRole,
    invitationStatus: m.invitationStatus ?? (m.isOwner ? "accepted" : "pending"),
    addedAt: m.addedAt ?? now.toISOString(),
  })) : [owner];
  if (!members.some((m) => m.role === "Owner")) members.unshift(owner);
  const start = project.deadlineKey ? toISODate(addMonths(fromISODate(project.deadlineKey), -1)) : toISODate(now);
  return {
    ...project, members, notes: [], activity: (project.activity ?? []).map((a) => ({
      ...a, projectId: project.id, actionType: a.actionType ?? a.type ?? "projectEdited",
      createdAt: a.createdAt ?? now.toISOString(),
    })),
    timeline: project.timeline ?? { preset: "month", startDate: start, endDate: project.deadlineKey ?? toISODate(addMonths(now, 1)) },
  };
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const archive = useArchiveStore();
  const { profile } = useProfileStore();
  const actorEmail = profile.email.trim().toLowerCase() || "owner@planly.local";
  const actorName = profile.displayName.trim() || `${profile.firstName} ${profile.lastName}`.trim() || "Пользователь";
  const [projects, setProjects] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage<Project[] | null>(PROJECTS_STORAGE_KEY, null);
    setProjects((stored ?? []).map((p) => normalize(p, actorEmail, actorName)));
    setHydrated(true);
  }, [actorEmail, actorName]);
  useEffect(() => { if (hydrated) writeStorage(PROJECTS_STORAGE_KEY, projects); }, [projects, hydrated]);

  const getProjectById = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);
  const currentRole = useCallback((p: Project): ProjectRole =>
    (p.members.find((m) => m.email?.toLowerCase() === actorEmail)?.role as ProjectRole | undefined) ?? "Owner", [actorEmail]);
  const canEdit = useCallback((p: Project) => currentRole(p) !== "Viewer", [currentRole]);
  const canManageMembers = useCallback((p: Project) => currentRole(p) === "Owner", [currentRole]);
  const activity = useCallback((projectId: string, input: ActivityInput): ProjectActivityEntry => ({
    id: uid("activity"), projectId, actionType: input.actionType, type: input.actionType,
    actor: actorName, actorEmail, actorName, message: input.message, entityType: input.entityType,
    entityId: input.entityId, createdAt: new Date().toISOString(), metadata: input.metadata,
  }), [actorEmail, actorName]);
  const logActivity = useCallback((projectId: string, input: ActivityInput) => {
    const entry = activity(projectId, input);
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, activity: [entry, ...p.activity] } : p));
  }, [activity]);

  const createProject = useCallback((v: ProjectFormValues) => {
    const id = uid("p"); const now = new Date(); const tags = Array.from(new Set(v.tags.split(",").map(x => x.trim()).filter(Boolean)));
    const owner: ProjectMember = { id: `${id}-owner`, email: actorEmail, displayName: actorName, name: actorName, role: "Owner", invitationStatus: "accepted", addedAt: now.toISOString(), workloadPercent: 0, isOwner: true };
    const created: Project = {
      id, name: v.name.trim(), description: v.description.trim(), iconKey: "folder", color: v.color,
      status: v.status, priority: v.priority, progress: 0, tasksDone: 0, tasksTotal: 0,
      deadlineLabel: v.deadlineKey ? formatShortDate(fromISODate(v.deadlineKey)) : "—", deadlineKey: v.deadlineKey || null,
      createdAtLabel: formatProjectDateLabel(now), starred: false, archived: false, tags, members: [owner],
      tasks: [], notes: [], files: [], activity: [], milestones: DEFAULT_MILESTONES.map((label, i) => ({ id: `${id}-ms${i}`, label, dateLabel: "—", status: "upcoming" })),
      timeline: { preset: "month", startDate: toISODate(now), endDate: toISODate(addMonths(now, 1)) },
    };
    created.activity = [activity(id, { actionType: "projectCreated", message: `создал(а) проект «${created.name}»`, entityType: "project", entityId: id })];
    setProjects((prev) => [created, ...prev]); return created;
  }, [actorEmail, actorName, activity]);

  const updateProject = useCallback((id: string, v: ProjectFormValues) => {
    const p = projects.find(x => x.id === id); if (!p || !canEdit(p)) return false;
    const tags = Array.from(new Set(v.tags.split(",").map(x => x.trim()).filter(Boolean)));
    const entry = activity(id, { actionType: p.status !== v.status ? "statusChanged" : "projectEdited", message: p.status !== v.status ? "изменил(а) статус проекта" : "изменил(а) проект", entityType: "project", entityId: id });
    setProjects(prev => prev.map(x => x.id === id ? progress({ ...x, name: v.name.trim(), description: v.description.trim(), color: v.color, status: v.status, priority: v.priority, deadlineKey: v.deadlineKey || null, deadlineLabel: v.deadlineKey ? formatShortDate(fromISODate(v.deadlineKey)) : "—", tags, activity: [entry, ...x.activity] }) : x));
    recordDailyActivity();
    return true;
  }, [projects, canEdit, activity]);

  const deleteProject = useCallback((id: string) => {
    const p = projects.find(x => x.id === id); if (!p || currentRole(p) !== "Owner") return false;
    archive.addItem({ entityType: "project", entityId: p.id, title: p.name, preview: p.description, sourceModule: "Проекты", icon: p.iconKey, color: p.color, originalData: p });
    setProjects(prev => prev.filter(x => x.id !== id)); return true;
  }, [projects, currentRole, archive]);
  const restoreDeletedProject = useCallback((p: Project) => setProjects(prev => [normalize(p, actorEmail, actorName), ...prev]), [actorEmail, actorName]);
  const toggleStar = useCallback((id: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, starred: !p.starred } : p)), []);
  const archiveProject = useCallback((id: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, archived: true } : p)), []);
  const restoreProject = useCallback((id: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, archived: false } : p)), []);
  const duplicateProject = useCallback((id: string) => { const p = projects.find(x => x.id === id); if (p) createProject({ name: `${p.name} (копия)`, description: p.description, color: p.color, status: p.status, priority: p.priority, deadlineKey: p.deadlineKey ?? "", tags: p.tags.join(",") }); }, [projects, createProject]);

  const addTask = useCallback((projectId: string, title: string) => {
    const p = projects.find(x => x.id === projectId); const clean = title.trim(); if (!p || !clean || !canEdit(p)) return null;
    const task: ProjectTask = { id: uid(`${projectId}-task`), title: clean, status: "todo", priority: "medium", assigneeId: null, dueLabel: null, dueDate: null };
    const entry = activity(projectId, { actionType: "taskCreated", message: `создал(а) задачу «${clean}»`, entityType: "task", entityId: task.id });
    setProjects(prev => prev.map(x => x.id === projectId ? progress({ ...x, tasks: [...x.tasks, task], activity: [entry, ...x.activity] }) : x)); return task;
  }, [projects, canEdit, activity]);
  const moveTask = useCallback((projectId: string, taskId: string, status: ProjectTaskStatus) => {
    const p = projects.find(x => x.id === projectId); if (!p || !canEdit(p)) return false; const task = p.tasks.find(t => t.id === taskId); if (!task || task.status === status) return false;
    const entry = activity(projectId, { actionType: status === "done" ? "taskCompleted" : "taskEdited", message: status === "done" ? `завершил(а) задачу «${task.title}»` : `изменил(а) статус задачи «${task.title}»`, entityType: "task", entityId: taskId });
    setProjects(prev => prev.map(x => x.id === projectId ? progress({ ...x, tasks: x.tasks.map(t => t.id === taskId ? { ...t, status } : t), activity: [entry, ...x.activity] }) : x)); return true;
  }, [projects, canEdit, activity]);
  const updateTask = useCallback((projectId: string, taskId: string, patch: Partial<ProjectTask>) => {
    const p = projects.find(x => x.id === projectId); if (!p || !canEdit(p)) return false;
    const entry = activity(projectId, { actionType: "taskEdited", message: "изменил(а) задачу", entityType: "task", entityId: taskId });
    setProjects(prev => prev.map(x => x.id === projectId ? progress({ ...x, tasks: x.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t), activity: [entry, ...x.activity] }) : x)); return true;
  }, [projects, canEdit, activity]);
  const deleteTask = useCallback((projectId: string, taskId: string, shouldArchive = false) => {
    const p = projects.find(x => x.id === projectId); const task = p?.tasks.find(t => t.id === taskId); if (!p || !task || !canEdit(p)) return false;
    if (shouldArchive) archive.addItem({ entityType: "projectTask", entityId: task.id, title: task.title, preview: p.name, sourceModule: "Задачи проекта", originalData: { projectId, projectTitle: p.name, task } });
    const entry = activity(projectId, { actionType: shouldArchive ? "taskArchived" : "taskDeleted", message: `${shouldArchive ? "архивировал(а)" : "удалил(а)"} задачу «${task.title}»`, entityType: "task", entityId: taskId });
    setProjects(prev => prev.map(x => x.id === projectId ? progress({ ...x, tasks: x.tasks.filter(t => t.id !== taskId), activity: [entry, ...x.activity] }) : x)); return true;
  }, [projects, canEdit, activity, archive]);
  const restoreArchivedTask = useCallback((projectId: string, task: ProjectTask) => {
    const p = projects.find(x => x.id === projectId); if (!p) return false;
    const entry = activity(projectId, { actionType: "taskRestored", message: `восстановил(а) задачу «${task.title}»`, entityType: "task", entityId: task.id });
    setProjects(prev => prev.map(x => x.id === projectId ? progress({ ...x, tasks: [...x.tasks, task], activity: [entry, ...x.activity] }) : x)); return true;
  }, [projects, activity]);

  const addMember = useCallback((projectId: string, email: string) => {
    const p = projects.find(x => x.id === projectId); const clean = email.trim().toLowerCase(); if (!p || !canManageMembers(p) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || p.members.some(m => m.email?.toLowerCase() === clean)) return false;
    const member: ProjectMember = { id: uid("member"), email: clean, name: clean.split("@")[0], role: "Viewer", invitationStatus: "pending", addedAt: new Date().toISOString(), workloadPercent: 0 };
    const entry = activity(projectId, { actionType: "memberAdded", message: `добавил(а) участника ${clean}`, entityType: "member", entityId: member.id });
    setProjects(prev => prev.map(x => x.id === projectId ? { ...x, members: [...x.members, member], activity: [entry, ...x.activity] } : x)); return true;
  }, [projects, canManageMembers, activity]);
  const removeMember = useCallback((projectId: string, memberId: string) => {
    const p = projects.find(x => x.id === projectId); const m = p?.members.find(x => x.id === memberId); if (!p || !m || !canManageMembers(p) || m.role === "Owner") return false;
    const entry = activity(projectId, { actionType: "memberRemoved", message: `удалил(а) участника ${m.email}`, entityType: "member", entityId: memberId });
    setProjects(prev => prev.map(x => x.id === projectId ? { ...x, members: x.members.filter(m => m.id !== memberId), activity: [entry, ...x.activity] } : x)); return true;
  }, [projects, canManageMembers, activity]);
  const changeMemberRole = useCallback((projectId: string, memberId: string, role: ProjectRole) => {
    const p = projects.find(x => x.id === projectId); const m = p?.members.find(x => x.id === memberId); if (!p || !m || !canManageMembers(p) || m.role === "Owner" || role === "Owner") return false;
    const entry = activity(projectId, { actionType: "memberRoleChanged", message: `изменил(а) роль ${m.email} на ${role}`, entityType: "member", entityId: memberId });
    setProjects(prev => prev.map(x => x.id === projectId ? { ...x, members: x.members.map(m => m.id === memberId ? { ...m, role } : m), activity: [entry, ...x.activity] } : x)); return true;
  }, [projects, canManageMembers, activity]);
  const setTimeline = useCallback((projectId: string, preset: ProjectTimelinePreset, startDate: string, endDate: string) => {
    const p = projects.find(x => x.id === projectId); if (!p || !canEdit(p) || !startDate || endDate < startDate) return false;
    const timeline: ProjectTimeline = { preset, startDate, endDate }; const entry = activity(projectId, { actionType: "timelineChanged", message: `изменил(а) период проекта: ${startDate} — ${endDate}`, entityType: "timeline" });
    setProjects(prev => prev.map(x => x.id === projectId ? { ...x, timeline, activity: [entry, ...x.activity] } : x)); return true;
  }, [projects, canEdit, activity]);
  const addTag = useCallback((projectId: string, tag: string) => { const p = projects.find(x => x.id === projectId); const clean = tag.trim(); if (!p || !canEdit(p) || !clean || p.tags.some(t => t.toLowerCase() === clean.toLowerCase())) return false; const e = activity(projectId, { actionType: "tagAdded", message: `добавил(а) тег #${clean}`, entityType: "tag", entityId: clean }); setProjects(prev => prev.map(x => x.id === projectId ? { ...x, tags: [...x.tags, clean], activity: [e, ...x.activity] } : x)); return true; }, [projects, canEdit, activity]);
  const removeTag = useCallback((projectId: string, tag: string) => { const p = projects.find(x => x.id === projectId); if (!p || !canEdit(p) || !p.tags.includes(tag)) return false; const e = activity(projectId, { actionType: "tagRemoved", message: `удалил(а) тег #${tag}`, entityType: "tag", entityId: tag }); setProjects(prev => prev.map(x => x.id === projectId ? { ...x, tags: x.tags.filter(t => t !== tag), activity: [e, ...x.activity] } : x)); return true; }, [projects, canEdit, activity]);
  const renameTag = useCallback((projectId: string, oldTag: string, newTag: string) => { const p = projects.find(x => x.id === projectId); const clean = newTag.trim(); if (!p || !canEdit(p) || !clean || p.tags.some(t => t.toLowerCase() === clean.toLowerCase())) return false; const e = activity(projectId, { actionType: "tagEdited", message: `переименовал(а) тег #${oldTag} в #${clean}`, entityType: "tag", entityId: clean }); setProjects(prev => prev.map(x => x.id === projectId ? { ...x, tags: x.tags.map(t => t === oldTag ? clean : t), activity: [e, ...x.activity] } : x)); return true; }, [projects, canEdit, activity]);

  const value = useMemo<ProjectsStoreValue>(() => ({ projects, getProjectById, currentRole, canEdit, canManageMembers, createProject, updateProject, deleteProject, restoreDeletedProject, duplicateProject, archiveProject, restoreProject, toggleStar, moveTask, addTask, updateTask, deleteTask, restoreArchivedTask, addMember, removeMember, changeMemberRole, setTimeline, addTag, removeTag, renameTag, logActivity }), [projects, getProjectById, currentRole, canEdit, canManageMembers, createProject, updateProject, deleteProject, restoreDeletedProject, duplicateProject, archiveProject, restoreProject, toggleStar, moveTask, addTask, updateTask, deleteTask, restoreArchivedTask, addMember, removeMember, changeMemberRole, setTimeline, addTag, removeTag, renameTag, logActivity]);
  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjectsStore() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjectsStore must be used within a ProjectsProvider");
  return ctx;
}

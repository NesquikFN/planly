import { diffInCalendarDays, fromISODate } from "@/lib/date-utils";
import type {
  Project,
  ProjectMember,
  ProjectMilestoneStatus,
  ProjectPriority,
  ProjectStatus,
  ProjectTask,
  ProjectTaskStatus,
} from "@/types/project";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "В работе",
  completed: "Завершён",
  onHold: "Отложен",
};

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, string> = {
  active: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  completed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  onHold: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочно",
};

export const PROJECT_PRIORITY_BADGE: Record<ProjectPriority, string> = {
  low: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  high: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  urgent: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

// Local copies of Planly's shared card/title tokens (see components/settings
// for the canonical values) — kept here rather than imported so the Projects
// module stays self-contained and doesn't reach into other sections.
export const projectCard = "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900";
export const projectSectionTitle = "text-sm font-semibold text-gray-900 dark:text-gray-50";

export const PROJECT_TASK_STATUSES: ProjectTaskStatus[] = ["todo", "inProgress", "review", "done"];

export const PROJECT_TASK_STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  todo: "To Do",
  inProgress: "In Progress",
  review: "Review",
  done: "Done",
};

export const PROJECT_TASK_PRIORITY_DOT: Record<ProjectTask["priority"], string> = {
  low: "bg-gray-300 dark:bg-gray-600",
  medium: "bg-blue-400",
  high: "bg-red-400",
};

/** Active projects past their deadline. Completed/on-hold projects are never "overdue". */
export function isProjectOverdue(project: Project, today: Date): boolean {
  if (project.status !== "active" || !project.deadlineKey) return false;
  return diffInCalendarDays(today, fromISODate(project.deadlineKey)) > 0;
}

export function getMemberById(project: Project, id: string | null): ProjectMember | undefined {
  if (!id) return undefined;
  return project.members.find((member) => member.id === id);
}

export interface ProjectsFilters {
  search: string;
  status: ProjectStatus | null;
  priority: ProjectPriority | null;
  tag: string | null;
  summary: ProjectSummaryFilter;
  today: Date;
}

export type ProjectSummaryFilter = "all" | "active" | "completed" | "overdue" | "inProgress";

function matchesSummaryFilter(project: Project, summary: ProjectSummaryFilter, today: Date): boolean {
  switch (summary) {
    case "active":
      return project.status === "active";
    case "completed":
      return project.status === "completed";
    case "overdue":
      return isProjectOverdue(project, today);
    case "inProgress":
      return project.progress > 0 && project.progress < 100;
    case "all":
    default:
      return true;
  }
}

export function filterProjects(projects: Project[], filters: ProjectsFilters): Project[] {
  const query = filters.search.trim().toLowerCase();

  return projects.filter((project) => {
    if (project.archived) return false;
    if (!matchesSummaryFilter(project, filters.summary, filters.today)) return false;
    if (filters.status && project.status !== filters.status) return false;
    if (filters.priority && project.priority !== filters.priority) return false;
    if (filters.tag && !project.tags.includes(filters.tag)) return false;
    if (query) {
      const haystack = `${project.name} ${project.description} ${project.tags.join(" ")}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function getUniqueTags(projects: Project[]): string[] {
  return Array.from(new Set(projects.flatMap((project) => project.tags))).sort((a, b) => a.localeCompare(b, "ru"));
}

export function sortProjects(projects: Project[], sortLabel: string): Project[] {
  const sorted = [...projects];

  switch (sortLabel) {
    case "По прогрессу":
      sorted.sort((a, b) => b.progress - a.progress);
      break;
    case "По сроку":
      sorted.sort((a, b) => {
        if (!a.deadlineKey && !b.deadlineKey) return 0;
        if (!a.deadlineKey) return 1;
        if (!b.deadlineKey) return -1;
        return a.deadlineKey.localeCompare(b.deadlineKey);
      });
      break;
    case "По задачам":
      sorted.sort((a, b) => b.tasksTotal - a.tasksTotal);
      break;
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }

  return sorted;
}

export interface ProjectsOverviewStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  avgProgress: number;
}

export function computeOverviewStats(projects: Project[], today: Date): ProjectsOverviewStats {
  const visible = projects.filter((project) => !project.archived);
  const total = visible.length;
  const active = visible.filter((project) => project.status === "active").length;
  const completed = visible.filter((project) => project.status === "completed").length;
  const overdue = visible.filter((project) => isProjectOverdue(project, today)).length;
  const avgProgress = total === 0 ? 0 : Math.round(visible.reduce((sum, project) => sum + project.progress, 0) / total);

  return { total, active, completed, overdue, avgProgress };
}

export function groupTasksByStatus(tasks: ProjectTask[]): Record<ProjectTaskStatus, ProjectTask[]> {
  const groups: Record<ProjectTaskStatus, ProjectTask[]> = { todo: [], inProgress: [], review: [], done: [] };
  for (const task of tasks) groups[task.status].push(task);
  return groups;
}

/**
 * Single source of truth for "which milestone stage are we in" — used both
 * to seed mock milestones and to keep them in sync when Kanban moves change
 * a project's progress.
 */
export function computeMilestoneStatus(index: number, stageCount: number, progress: number): ProjectMilestoneStatus {
  const startThreshold = (index / (stageCount - 1)) * 100;
  const endThreshold = index === stageCount - 1 ? 100 : ((index + 1) / (stageCount - 1)) * 100;
  return progress >= endThreshold ? "done" : progress >= startThreshold ? "current" : "upcoming";
}

/** "25 июля 2026" — used for createdAtLabel; date-utils has no day+month+year formatter. */
export function formatProjectDateLabel(date: Date): string {
  const label = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

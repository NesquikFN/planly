import type { LucideIcon } from "lucide-react";
import type { CalendarColor } from "@/types/calendar";

// Domain model for the Projects module. Everything here is populated from
// mock data today (see lib/projects-mock-data.ts) — no store/API calls yet.
// Kept intentionally close to what a real backend response would look like
// (stable ids, ISO date keys alongside display labels) so swapping the mock
// factory for a real fetch later doesn't require touching the components.

export type ProjectStatus = "active" | "completed" | "onHold";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectMember {
  id: string;
  name: string;
  role: string;
  /** 0–100, used for the workload bar in Team. */
  workloadPercent: number;
  isOwner?: boolean;
}

export type ProjectTaskStatus = "todo" | "inProgress" | "review" | "done";
export type ProjectTaskPriority = "low" | "medium" | "high";

export interface ProjectTask {
  id: string;
  title: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assigneeId: string | null;
  dueLabel: string | null;
}

export interface ProjectNote {
  id: string;
  title: string;
  excerpt: string;
  updatedLabel: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  typeLabel: string;
  sizeLabel: string;
  uploadedAtLabel: string;
  uploadedBy: string;
}

export type ProjectActivityType =
  | "created"
  | "statusChanged"
  | "taskCompleted"
  | "memberAdded"
  | "fileUploaded"
  | "commented"
  | "updated";

export interface ProjectActivityEntry {
  id: string;
  type: ProjectActivityType;
  actor: string;
  message: string;
  timeLabel: string;
}

export type ProjectMilestoneStatus = "done" | "current" | "upcoming";

export interface ProjectMilestone {
  id: string;
  label: string;
  dateLabel: string;
  status: ProjectMilestoneStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: CalendarColor;
  status: ProjectStatus;
  priority: ProjectPriority;
  /** 0–100 */
  progress: number;
  tasksDone: number;
  tasksTotal: number;
  /** Human-readable label, e.g. "12 авг" or "—" when there is no deadline. */
  deadlineLabel: string;
  /** ISO "YYYY-MM-DD", or null when there is no deadline — used for overdue checks. */
  deadlineKey: string | null;
  createdAtLabel: string;
  starred: boolean;
  archived: boolean;
  tags: string[];
  members: ProjectMember[];
  tasks: ProjectTask[];
  notes: ProjectNote[];
  files: ProjectFile[];
  activity: ProjectActivityEntry[];
  milestones: ProjectMilestone[];
}

/** Fields the create/edit modal collects — a plain draft, not a full Project. */
export interface ProjectFormValues {
  name: string;
  description: string;
  color: CalendarColor;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadlineKey: string;
  tags: string;
}

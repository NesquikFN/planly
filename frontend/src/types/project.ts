import type { CalendarColor } from "@/types/calendar";

// Domain model for the Projects module — persisted to localStorage via
// useProjectsStore. `iconKey` is a string (resolved to a component via
// PROJECT_ICON_MAP in lib/projects-mock-data.ts) rather than a LucideIcon
// reference, since a component reference can't survive JSON.stringify.

export type ProjectIconKey =
  | "palette"
  | "smartphone"
  | "megaphone"
  | "search"
  | "bar-chart"
  | "globe"
  | "book-open"
  | "users"
  | "rocket"
  | "folder";

export type ProjectStatus = "active" | "completed" | "onHold";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";
export type ProjectRole = "Owner" | "Editor" | "Viewer";
export type ProjectInvitationStatus = "accepted" | "pending";

export interface ProjectMember {
  id: string;
  email?: string;
  displayName?: string;
  name: string;
  role: ProjectRole | string;
  invitationStatus?: ProjectInvitationStatus;
  addedAt?: string;
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
  dueDate?: string | null;
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
  | "projectCreated" | "projectEdited" | "statusChanged" | "timelineChanged"
  | "tagAdded" | "tagRemoved" | "tagEdited"
  | "memberAdded" | "memberRemoved" | "memberRoleChanged"
  | "taskCreated" | "taskEdited" | "taskCompleted" | "taskDeleted" | "taskArchived" | "taskRestored"
  | "noteCreated" | "noteEdited" | "noteDeleted"
  | "eventCreated" | "eventUpdated" | "eventUnlinked"
  | "created" | "fileUploaded" | "commented" | "updated";
  

export interface ProjectActivityEntry {
  id: string;
  projectId?: string;
  actionType?: ProjectActivityType;
  type?: ProjectActivityType;
  actor: string;
  actorEmail?: string;
  actorName?: string;
  message: string;
  entityType?: "project" | "task" | "note" | "event" | "tag" | "member" | "timeline";
  entityId?: string;
  createdAt?: string;
  timeLabel?: string;
  metadata?: Record<string, unknown>;
}

export type ProjectTimelinePreset = "week" | "month" | "quarter" | "custom";
export interface ProjectTimeline {
  preset: ProjectTimelinePreset;
  startDate: string;
  endDate: string;
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
  iconKey: ProjectIconKey;
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
  timeline?: ProjectTimeline;
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

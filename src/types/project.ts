import type { LucideIcon } from "lucide-react";
import type { CalendarColor } from "@/types/calendar";

export type ProjectStatus = "active" | "completed" | "onHold";

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: CalendarColor;
  status: ProjectStatus;
  /** 0–100 */
  progress: number;
  tasksDone: number;
  tasksTotal: number;
  /** Human-readable label, e.g. "12 авг" or "—" when there is no deadline. */
  deadlineLabel: string;
  starred: boolean;
}

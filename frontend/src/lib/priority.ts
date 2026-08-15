import type { TaskPriority } from "@/types/task";

export const priorityStyles: Record<
  TaskPriority,
  { title: string; due: string; flag: string }
> = {
  overdue: { title: "text-red-500", due: "text-red-500", flag: "text-red-500" },
  important: { title: "text-amber-500", due: "text-amber-500", flag: "text-amber-500" },
  upcoming: { title: "text-blue-600", due: "text-blue-600", flag: "text-blue-600" },
  none: { title: "text-gray-500", due: "text-gray-400", flag: "text-gray-300" },
};

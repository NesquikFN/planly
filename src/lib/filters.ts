import type { Task, TaskPriority } from "@/types/task";

export type FilterKey = "all" | "overdue" | "today" | "upcoming" | "none" | "onlyImportant";

export const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "overdue", label: "Просроченные" },
  { key: "today", label: "Сегодня" },
  { key: "upcoming", label: "Будущие" },
  { key: "none", label: "Без срока" },
  { key: "onlyImportant", label: "Только важные" },
];

// "today" reuses the "important" bucket: in the mock data those are the tasks
// scheduled for today (times like 10:00, 13:30). There is no real Date model yet.
const filterToPriority: Partial<Record<FilterKey, TaskPriority>> = {
  overdue: "overdue",
  today: "important",
  upcoming: "upcoming",
  none: "none",
};

export function matchesFilter(task: Task, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "onlyImportant") return task.important;
  const priority = filterToPriority[filter];
  return priority ? task.priority === priority : true;
}

export type SortKey = "date" | "priority" | "name";

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: "date", label: "По дате" },
  { key: "priority", label: "По приоритету" },
  { key: "name", label: "По названию" },
];

const priorityRank: Record<TaskPriority, number> = {
  overdue: 0,
  important: 1,
  upcoming: 2,
  none: 3,
};

export function sortTasks(tasks: Task[], sortKey: SortKey): Task[] {
  if (sortKey === "name") {
    return [...tasks].sort((a, b) => a.title.localeCompare(b.title, "ru"));
  }
  if (sortKey === "priority") {
    return [...tasks].sort((a, b) => {
      const importantDiff = Number(b.important) - Number(a.important);
      if (importantDiff !== 0) return importantDiff;
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
  }
  // "date" — sort by the task's real date/time; undated tasks sort last.
  return [...tasks].sort((a, b) => {
    const dateA = a.date ?? "9999-99-99";
    const dateB = b.date ?? "9999-99-99";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.time ?? "23:59").localeCompare(b.time ?? "23:59");
  });
}

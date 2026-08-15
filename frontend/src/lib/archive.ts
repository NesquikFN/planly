import { Bell, Folder, ListChecks, StickyNote, type LucideIcon } from "lucide-react";
import { diffInCalendarDays, fromISODate, getLocalDateKey } from "@/lib/date-utils";
import { NOTE_ICON_MAP } from "@/lib/notes";
import { PROJECT_ICON_MAP } from "@/lib/projects-mock-data";
import type { NoteIconKey } from "@/types/note";
import type { ProjectIconKey } from "@/types/project";
import type { ArchiveDateFilterKey, ArchiveDateFilterOption, ArchiveEntityType, ArchiveItem } from "@/types/archive";

export interface ArchiveCategoryInfo {
  key: ArchiveEntityType;
  label: string;
  icon: LucideIcon;
}

// Note: "event" (real Calendar events) stays a valid ArchiveEntityType — Calendar
// still archives its own deletions under it — but this category grid deliberately
// has no card for it; the "reminder" slot below is what's surfaced here.
export const ARCHIVE_CATEGORIES: ArchiveCategoryInfo[] = [
  { key: "projectTask", label: "Архив задач проекта", icon: ListChecks },
  { key: "task", label: "Архив задач", icon: ListChecks },
  { key: "note", label: "Архив заметок", icon: StickyNote },
  { key: "project", label: "Архив проектов", icon: Folder },
  { key: "reminder", label: "Архив напоминаний", icon: Bell },
];

export const ARCHIVE_TYPE_LABELS: Record<ArchiveEntityType, string> = {
  projectTask: "Задача проекта",
  task: "Задача",
  note: "Заметка",
  project: "Проект",
  event: "Событие",
  reminder: "Напоминание",
};

export const ARCHIVE_DATE_FILTERS: ArchiveDateFilterOption[] = [
  { key: "all", label: "Всё время" },
  { key: "7d", label: "За 7 дней" },
  { key: "30d", label: "За 30 дней" },
  { key: "90d", label: "За 3 месяца" },
  { key: "year", label: "За этот год" },
];

/** Real, approximate byte size of the snapshot — from the JSON it actually takes up in localStorage, not a fabricated number. */
export function estimateItemBytes(item: ArchiveItem): number {
  try {
    return new Blob([JSON.stringify(item.originalData)]).size;
  } catch {
    return 0;
  }
}

export function formatByteSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${bytes} Б`;
}

function matchesDateFilter(item: ArchiveItem, filter: ArchiveDateFilterKey, now: Date): boolean {
  if (filter === "all") return true;
  const deletedDate = fromISODate(getLocalDateKey(new Date(item.deletedAt)));
  const daysAgo = diffInCalendarDays(now, deletedDate);

  if (filter === "year") return deletedDate.getFullYear() === now.getFullYear();
  if (filter === "7d") return daysAgo >= 0 && daysAgo <= 7;
  if (filter === "30d") return daysAgo >= 0 && daysAgo <= 30;
  if (filter === "90d") return daysAgo >= 0 && daysAgo <= 90;
  return true;
}

export interface ArchiveFilterState {
  search: string;
  typeFilter: ArchiveEntityType | null;
  dateFilter: ArchiveDateFilterKey;
}

export function filterArchiveItems(items: ArchiveItem[], filters: ArchiveFilterState, now: Date): ArchiveItem[] {
  const query = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.typeFilter && item.entityType !== filters.typeFilter) return false;
    if (!matchesDateFilter(item, filters.dateFilter, now)) return false;
    if (query) {
      const haystack = `${item.title} ${item.preview ?? ""} ${item.sourceModule}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export interface ArchiveCategorySummary {
  key: ArchiveEntityType;
  count: number;
  sizeLabel: string;
}

export function getCategorySummaries(items: ArchiveItem[]): Record<ArchiveEntityType, ArchiveCategorySummary> {
  const summaries = {} as Record<ArchiveEntityType, ArchiveCategorySummary>;

  for (const category of ARCHIVE_CATEGORIES) {
    const typeItems = items.filter((item) => item.entityType === category.key);
    const totalBytes = typeItems.reduce((sum, item) => sum + estimateItemBytes(item), 0);
    summaries[category.key] = { key: category.key, count: typeItems.length, sizeLabel: formatByteSize(totalBytes) };
  }

  return summaries;
}

export function formatDeletedAtLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * The icon to render for an item: notes/projects carry their own real
 * iconKey (from their own module's icon map), task/event fall back to the
 * generic per-category glyph — this is a display-only lookup, not a second
 * copy of icon data (the source of truth stays in `originalData`).
 */
export function resolveArchiveIcon(item: ArchiveItem): LucideIcon {
  if (item.entityType === "note" && item.icon) return NOTE_ICON_MAP[item.icon as NoteIconKey] ?? StickyNote;
  if (item.entityType === "project" && item.icon) return PROJECT_ICON_MAP[item.icon as ProjectIconKey] ?? Folder;
  return ARCHIVE_CATEGORIES.find((category) => category.key === item.entityType)?.icon ?? ListChecks;
}

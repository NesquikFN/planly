import { diffInCalendarDays, fromISODate } from "@/lib/date-utils";
import type { ArchiveDateFilterKey, ArchiveItem, ArchiveItemType } from "@/types/archive";

export function formatSizeLabel(sizeKb: number): string {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} МБ`;
  return `${sizeKb} КБ`;
}

export function getUniqueProjects(items: ArchiveItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.project).filter((project): project is string => Boolean(project)))).sort(
    (a, b) => a.localeCompare(b, "ru"),
  );
}

export function getUniqueTags(items: ArchiveItem[]): string[] {
  return Array.from(new Set(items.flatMap((item) => item.tags))).sort((a, b) => a.localeCompare(b, "ru"));
}

function matchesDateFilter(item: ArchiveItem, filter: ArchiveDateFilterKey, now: Date): boolean {
  if (filter === "all") return true;
  const archivedDate = fromISODate(item.archivedAtKey);
  const daysAgo = diffInCalendarDays(now, archivedDate);

  if (filter === "year") return archivedDate.getFullYear() === now.getFullYear();
  if (filter === "7d") return daysAgo >= 0 && daysAgo <= 7;
  if (filter === "30d") return daysAgo >= 0 && daysAgo <= 30;
  if (filter === "90d") return daysAgo >= 0 && daysAgo <= 90;
  return true;
}

interface ArchiveFilters {
  search: string;
  typeFilter: ArchiveItemType | null;
  dateFilter: ArchiveDateFilterKey;
  projectFilter: string | null;
  tagFilter: string | null;
}

export function filterArchiveItems(items: ArchiveItem[], filters: ArchiveFilters, now: Date): ArchiveItem[] {
  const query = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.typeFilter && item.type !== filters.typeFilter) return false;
    if (filters.projectFilter && item.project !== filters.projectFilter) return false;
    if (filters.tagFilter && !item.tags.includes(filters.tagFilter)) return false;
    if (!matchesDateFilter(item, filters.dateFilter, now)) return false;
    if (query) {
      const haystack = `${item.name} ${item.project ?? ""} ${item.tags.join(" ")} ${item.author}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export interface ArchiveCategorySummary {
  key: ArchiveItemType;
  count: number;
  sizeLabel: string;
}

export function getCategorySummaries(items: ArchiveItem[]): Record<ArchiveItemType, ArchiveCategorySummary> {
  const summaries = {} as Record<ArchiveItemType, ArchiveCategorySummary>;
  const types: ArchiveItemType[] = ["task", "project", "note", "file", "event", "reminder"];

  for (const type of types) {
    const typeItems = items.filter((item) => item.type === type);
    const totalKb = typeItems.reduce((sum, item) => sum + item.sizeKb, 0);
    summaries[type] = { key: type, count: typeItems.length, sizeLabel: formatSizeLabel(totalKb) };
  }

  return summaries;
}

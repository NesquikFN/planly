import type { LucideIcon } from "lucide-react";

export type ArchiveItemType = "task" | "project" | "note" | "file" | "event" | "reminder";

export interface ArchiveItem {
  id: string;
  name: string;
  type: ArchiveItemType;
  project: string | null;
  tags: string[];
  createdAtLabel: string;
  archivedAtLabel: string;
  archivedAtKey: string;
  sizeKb: number;
  author: string;
}

export interface ArchiveCategoryInfo {
  key: ArchiveItemType;
  label: string;
  icon: LucideIcon;
}

export type ArchiveDateFilterKey = "all" | "7d" | "30d" | "90d" | "year";

export interface ArchiveDateFilterOption {
  key: ArchiveDateFilterKey;
  label: string;
}

export interface ArchiveStats {
  lastCleanupLabel: string;
  freeSpaceLabel: string;
  freeSpaceUsedPercent: number;
}

export type ArchivePendingAction =
  | { kind: "single"; id: string; name: string }
  | { kind: "selected"; ids: string[] }
  | { kind: "all" };

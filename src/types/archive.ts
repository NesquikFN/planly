// Single universal model for anything deleted from any module — the whole
// point is one shape and one store, never a per-entity ArchiveTask/
// ArchiveNote/etc. `originalData` is the one full snapshot of the deleted
// entity; nothing about it is duplicated into other fields on this type.

export type ArchiveEntityType = "task" | "projectTask" | "note" | "project" | "event" | "reminder";

export interface ArchiveItem {
  id: string;
  entityType: ArchiveEntityType;
  entityId: string;

  title: string;
  preview?: string;

  /** ISO datetime — when the entity was deleted (moved into the archive). */
  deletedAt: string;

  /** Human-readable origin, e.g. "Задачи", "Заметки", "Проекты", "Календарь". */
  sourceModule: string;

  icon?: string;
  color?: string;

  /** Full snapshot of the deleted entity, exactly as it lived in its own store — the only thing restore() needs. */
  originalData: unknown;
}

/** What each module hands the ArchiveStore when deleting — everything except id/deletedAt, which the store itself stamps. */
export type ArchiveItemInput = Omit<ArchiveItem, "id" | "deletedAt">;

export type ArchiveDateFilterKey = "all" | "7d" | "30d" | "90d" | "year";

export interface ArchiveDateFilterOption {
  key: ArchiveDateFilterKey;
  label: string;
}

export type ArchivePendingAction =
  | { kind: "single"; id: string; title: string }
  | { kind: "selected"; ids: string[] };

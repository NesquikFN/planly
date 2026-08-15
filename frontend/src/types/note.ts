import type { CalendarColor } from "@/types/calendar";

// Notes domain model — persisted to localStorage via useNotesStore. Unlike
// the old mock-only shape, nothing here holds a React component reference
// (LucideIcon) or a fixed "sections" layout — icons are looked up by string
// key (see lib/notes.ts NOTE_ICON_MAP) and the note body is real rich-text
// HTML (contentHtml) edited in a contentEditable surface, so it round-trips
// through JSON.stringify/parse without losing anything.

// No "trash" folder here — deleting a note removes it from this store
// entirely and hands it to the single app-wide ArchiveStore instead of
// keeping a second, module-local trashed copy.
export type NoteFolderKey = "all" | "favorites" | "recent" | "drafts" | "archived";

export type NoteIconKey =
  | "file-text"
  | "lightbulb"
  | "graduation-cap"
  | "mountain"
  | "wallet"
  | "users"
  | "stethoscope";

export interface NoteAttachment {
  id: string;
  name: string;
  mimeType: string;
  /** Bytes. */
  size: number;
  /** Base64 data URL — the only viable "real" file storage without a backend. */
  dataUrl: string;
  addedAt: string;
}

export interface NoteLinks {
  projectId?: string;
  taskId?: string;
  eventId?: string;
  reminderId?: string;
}

export interface NoteTagDef {
  label: string;
  color: CalendarColor;
}

export interface Note {
  id: string;
  title: string;
  /** Rich-text body — the contentEditable surface's innerHTML. */
  contentHtml: string;
  iconKey: NoteIconKey;
  color: CalendarColor;
  tags: string[];
  starred: boolean;
  pinned: boolean;
  draft: boolean;
  archived: boolean;
  /** ISO datetime. */
  createdAt: string;
  /** ISO datetime — bumped on every autosave. */
  updatedAt: string;
  attachments: NoteAttachment[];
  links: NoteLinks;
}

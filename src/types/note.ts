import type { LucideIcon } from "lucide-react";
import type { CalendarColor } from "@/types/calendar";

export type NoteFolderKey = "all" | "favorites" | "recent" | "drafts" | "archived" | "trash";

export interface NoteChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export type NoteSectionKind = "bullet" | "numbered" | "checklist";

export interface NoteSectionImage {
  icon: LucideIcon;
  label: string;
  tone: CalendarColor;
}

export interface NoteSection {
  id: string;
  heading: string;
  kind: NoteSectionKind;
  items?: string[];
  checklist?: NoteChecklistItem[];
  image: NoteSectionImage;
}

export interface NoteAttachment {
  id: string;
  label: string;
  tone: CalendarColor;
}

export interface NoteFile {
  id: string;
  name: string;
  size: string;
}

export interface NoteLinks {
  project?: string;
  task?: string;
  event?: { title: string; dateLabel: string };
}

export interface Note {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: CalendarColor;
  tags: string[];
  dateLabel: string;
  starred: boolean;
  draft: boolean;
  archived: boolean;
  trashed: boolean;
  thumbnail?: NoteSectionImage;
  sections?: NoteSection[];
  bottomChecklist?: NoteChecklistItem[];
  idea?: string;
  attachmentCount?: number;
  attachments?: NoteAttachment[];
  files?: NoteFile[];
  links?: NoteLinks;
  lastEditedLabel: string;
}

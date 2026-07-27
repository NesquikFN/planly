import {
  Archive,
  Clock,
  FileEdit,
  FileText,
  GraduationCap,
  Lightbulb,
  Mountain,
  Notebook,
  Star,
  Stethoscope,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { addDays, isToday, isYesterday, formatShortDate } from "@/lib/date-utils";
import type { CalendarEvent } from "@/types/calendar";
import type { Note, NoteAttachment, NoteFolderKey, NoteIconKey, NoteTagDef } from "@/types/note";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";

export function generateNoteId(prefix = "note"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const NOTE_ICON_MAP: Record<NoteIconKey, LucideIcon> = {
  "file-text": FileText,
  lightbulb: Lightbulb,
  "graduation-cap": GraduationCap,
  mountain: Mountain,
  wallet: Wallet,
  users: Users,
  stethoscope: Stethoscope,
};

export interface NoteFolderDef {
  key: NoteFolderKey;
  label: string;
  icon: LucideIcon;
}

export const NOTE_FOLDERS: NoteFolderDef[] = [
  { key: "all", label: "Все заметки", icon: Notebook },
  { key: "favorites", label: "Избранное", icon: Star },
  { key: "recent", label: "Недавние", icon: Clock },
  { key: "drafts", label: "Черновики", icon: FileEdit },
  { key: "archived", label: "Архив", icon: Archive },
];

export function countByFolder(notes: Note[]): Record<NoteFolderKey, number> {
  const counts: Record<NoteFolderKey, number> = { all: 0, favorites: 0, recent: 0, drafts: 0, archived: 0 };
  for (const folder of NOTE_FOLDERS) {
    counts[folder.key] = notes.filter((note) => matchesFolder(note, folder.key)).length;
  }
  return counts;
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes user-typed text (e.g. a prompted URL) before it's interpolated into an insertHTML string. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Short plain-text preview for list cards — empty notes get an honest placeholder, not fabricated text. */
export function noteExcerpt(note: Note, maxLength = 140): string {
  const text = extractPlainText(note.contentHtml);
  if (!text) return "Нет содержимого";
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export const DEFAULT_TAG_DEFS: NoteTagDef[] = [
  { label: "Работа", color: "blue" },
  { label: "Личное", color: "green" },
  { label: "Финансы", color: "orange" },
  { label: "Обучение", color: "purple" },
  { label: "Идеи", color: "pink" },
  { label: "Путешествия", color: "teal" },
];

const TAG_COLOR_CYCLE: NoteTagDef["color"][] = ["blue", "green", "purple", "orange", "pink", "teal", "red", "indigo"];

/** Deterministic color for a brand-new tag, based on how many tags already exist. */
export function nextTagColor(existingCount: number): NoteTagDef["color"] {
  return TAG_COLOR_CYCLE[existingCount % TAG_COLOR_CYCLE.length];
}

// --- Plain text / word count / reading time -----------------------------

/** Strips HTML tags to get searchable/countable plain text. Works during SSR too (regex fallback). */
export function extractPlainText(html: string): string {
  if (!html) return "";
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(plainText: string): number {
  const trimmed = plainText.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

const WORDS_PER_MINUTE = 200;

export function formatReadingTime(wordCount: number): string {
  if (wordCount === 0) return "нет текста";
  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  if (minutes % 10 === 1 && minutes % 100 !== 11) return `${minutes} минута чтения`;
  if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) return `${minutes} минуты чтения`;
  return `${minutes} минут чтения`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} КБ`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} МБ`;
}

/** "Сегодня, 13:42" / "Вчера, 18:20" / "12 авг." — matches the app's existing relative-date style. */
export function formatNoteDateLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (isToday(date)) return `Сегодня, ${time}`;
  if (isYesterday(date)) return `Вчера, ${time}`;
  return `${formatShortDate(date)}, ${time}`;
}

// --- Search / filter / sort ----------------------------------------------

export interface NoteRelationLabels {
  projectName: string | null;
  taskTitle: string | null;
  eventTitle: string | null;
}

export function resolveRelationLabels(note: Note, projects: Project[], tasks: Task[], events: CalendarEvent[]): NoteRelationLabels {
  return {
    projectName: note.links.projectId ? (projects.find((p) => p.id === note.links.projectId)?.name ?? null) : null,
    taskTitle: note.links.taskId ? (tasks.find((t) => t.id === note.links.taskId)?.title ?? null) : null,
    eventTitle: note.links.eventId ? (events.find((e) => e.id === note.links.eventId)?.title ?? null) : null,
  };
}

export function matchesFolder(note: Note, folder: NoteFolderKey): boolean {
  switch (folder) {
    case "all":
      return !note.archived;
    case "favorites":
      return note.starred && !note.archived;
    case "recent":
      return !note.archived;
    case "drafts":
      return note.draft && !note.archived;
    case "archived":
      return note.archived;
    default:
      return true;
  }
}

export type NoteFilterKey = "all" | "withAttachments" | "withRelations" | "withoutTags";

export function matchesQuickFilter(note: Note, filter: NoteFilterKey): boolean {
  switch (filter) {
    case "withAttachments":
      return note.attachments.length > 0;
    case "withRelations":
      return Boolean(note.links.projectId || note.links.taskId || note.links.eventId);
    case "withoutTags":
      return note.tags.length === 0;
    default:
      return true;
  }
}

export function matchesSearch(note: Note, query: string, relations: NoteRelationLabels): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (note.title.toLowerCase().includes(q)) return true;
  if (extractPlainText(note.contentHtml).toLowerCase().includes(q)) return true;
  if (note.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
  if (note.attachments.some((file) => file.name.toLowerCase().includes(q))) return true;
  if (relations.projectName?.toLowerCase().includes(q)) return true;
  if (relations.taskTitle?.toLowerCase().includes(q)) return true;
  if (relations.eventTitle?.toLowerCase().includes(q)) return true;
  return false;
}

export type NoteSortKey = "modified" | "created" | "title" | "favorite";

export function sortNotes(notes: Note[], sortKey: NoteSortKey): Note[] {
  const sorted = [...notes].sort((a, b) => {
    switch (sortKey) {
      case "title":
        return a.title.localeCompare(b.title, "ru");
      case "created":
        return b.createdAt.localeCompare(a.createdAt);
      case "favorite":
        return Number(b.starred) - Number(a.starred) || b.updatedAt.localeCompare(a.updatedAt);
      case "modified":
      default:
        return b.updatedAt.localeCompare(a.updatedAt);
    }
  });
  // Pinned notes always float to the top, regardless of the active sort.
  return [...sorted.filter((n) => n.pinned), ...sorted.filter((n) => !n.pinned)];
}

export function attachmentToFileMeta(file: File, dataUrl: string): NoteAttachment {
  return {
    id: generateNoteId("att"),
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
    addedAt: new Date().toISOString(),
  };
}

// --- First-run seed content ------------------------------------------------
// Converts the old decorative mock notes into real HTML bodies so first-time
// users still see the same sample content, now actually editable/persisted.

export function seedNotes(now: Date): Note[] {
  const iso = (daysAgo: number) => addDays(now, -daysAgo).toISOString();

  return [
    {
      id: "n1",
      title: "Протокол All-on-6",
      contentHtml:
        "<h2>1. Диагностика и планирование</h2>" +
        "<ul><li>Сбор анамнеза и осмотр пациента.</li><li>КЛКТ обследование.</li>" +
        "<li>Планирование в 3D-планировщике.</li><li>Изготовление хирургического шаблона.</li></ul>" +
        "<h2>2. Хирургический этап</h2>" +
        '<ul class="note-checklist">' +
        '<li class="note-checklist-item" data-checked="true">Обезболивание и разрез.</li>' +
        '<li class="note-checklist-item" data-checked="true">Установка 6 имплантов (4 прямых + 2 под углом).</li>' +
        '<li class="note-checklist-item" data-checked="true">Проверка первичной стабильности.</li>' +
        '<li class="note-checklist-item" data-checked="false">Установка формирователей десны.</li>' +
        '<li class="note-checklist-item" data-checked="false">Наложение швов.</li>' +
        "</ul>" +
        "<h2>3. Протезирование</h2>" +
        "<ol><li>Установка мультиюнитов.</li><li>Снятие слепков.</li>" +
        "<li>Изготовление временного протеза.</li><li>Примерка и фиксация.</li></ol>" +
        "<blockquote>Важно учитывать биотип десны и окклюзионную нагрузку. Проверить прикус через 2 недели.</blockquote>",
      iconKey: "stethoscope",
      color: "blue",
      tags: ["Стоматология", "Имплантация", "Протокол"],
      starred: true,
      pinned: true,
      draft: false,
      archived: false,
      createdAt: iso(0),
      updatedAt: iso(0),
      attachments: [],
      links: {},
    },
    {
      id: "n2",
      title: "Идеи для нового проекта",
      contentHtml: "<p>Несколько идей, которые хочу реализовать в ближайшее время…</p>",
      iconKey: "lightbulb",
      color: "pink",
      tags: ["Идеи"],
      starred: false,
      pinned: false,
      draft: true,
      archived: false,
      createdAt: iso(1),
      updatedAt: iso(1),
      attachments: [],
      links: {},
    },
    {
      id: "n3",
      title: "Курс по имплантологии",
      contentHtml: "<p>Список уроков и материалов для изучения.</p>",
      iconKey: "graduation-cap",
      color: "purple",
      tags: ["Обучение"],
      starred: false,
      pinned: false,
      draft: false,
      archived: false,
      createdAt: iso(1),
      updatedAt: iso(1),
      attachments: [],
      links: {},
    },
    {
      id: "n4",
      title: "Поездка в Грузию",
      contentHtml: "<p>План поездки, места, которые хочу посетить и попробовать.</p>",
      iconKey: "mountain",
      color: "teal",
      tags: ["Путешествия"],
      starred: false,
      pinned: false,
      draft: false,
      archived: false,
      createdAt: iso(13),
      updatedAt: iso(13),
      attachments: [],
      links: {},
    },
    {
      id: "n5",
      title: "Ежемесячный бюджет",
      contentHtml: "<p>Планирование бюджета на этот месяц.</p>",
      iconKey: "wallet",
      color: "orange",
      tags: ["Финансы"],
      starred: false,
      pinned: false,
      draft: false,
      archived: false,
      createdAt: iso(15),
      updatedAt: iso(15),
      attachments: [],
      links: {},
    },
    {
      id: "n6",
      title: "Встреча с клиентом",
      contentHtml: "<p>Обсудили новый проект и детали сотрудничества.</p>",
      iconKey: "users",
      color: "blue",
      tags: ["Работа"],
      starred: false,
      pinned: false,
      draft: false,
      archived: false,
      createdAt: iso(16),
      updatedAt: iso(16),
      attachments: [],
      links: {},
    },
  ];
}

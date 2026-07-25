import {
  Archive,
  Bone,
  Clock,
  FileEdit,
  GraduationCap,
  Lightbulb,
  Mountain,
  Notebook,
  ScanLine,
  Smile,
  Star,
  Stethoscope,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CalendarColor } from "@/types/calendar";
import type { Note, NoteFolderKey } from "@/types/note";

export interface NoteFolderDef {
  key: NoteFolderKey;
  label: string;
  icon: LucideIcon;
  count?: number;
}

// Static, decorative totals — match the reference mock exactly. The actual
// mock notes array below is much smaller; folder filters narrow within it.
export const NOTE_FOLDERS: NoteFolderDef[] = [
  { key: "all", label: "Все заметки", icon: Notebook, count: 128 },
  { key: "favorites", label: "Избранное", icon: Star, count: 16 },
  { key: "recent", label: "Недавние", icon: Clock },
  { key: "drafts", label: "Черновики", icon: FileEdit, count: 7 },
  { key: "archived", label: "Архив", icon: Archive },
  { key: "trash", label: "Корзина", icon: Trash2 },
];

export interface NoteTagDef {
  label: string;
  color: CalendarColor;
  count: number;
}

export const NOTE_TAGS: NoteTagDef[] = [
  { label: "Работа", color: "blue", count: 32 },
  { label: "Личное", color: "green", count: 24 },
  { label: "Финансы", color: "orange", count: 18 },
  { label: "Обучение", color: "purple", count: 12 },
  { label: "Идеи", color: "pink", count: 16 },
  { label: "Путешествия", color: "teal", count: 8 },
];

// Colors for tags that appear on notes but aren't in the top-6 sidebar list.
const EXTRA_TAG_COLORS: Record<string, CalendarColor> = {
  Стоматология: "indigo",
  Имплантация: "blue",
  Протокол: "teal",
};

export function tagColor(tag: string): CalendarColor {
  const fromSidebar = NOTE_TAGS.find((item) => item.label === tag);
  if (fromSidebar) return fromSidebar.color;
  return EXTRA_TAG_COLORS[tag] ?? "blue";
}

export const mockNotes: Note[] = [
  {
    id: "n1",
    title: "Протокол All-on-6",
    description: "Пошаговый протокол установки имплантов по системе All-on-6…",
    icon: Stethoscope,
    color: "blue",
    tags: ["Стоматология", "Имплантация", "Протокол"],
    dateLabel: "Сегодня, 13:42",
    starred: true,
    draft: false,
    archived: false,
    trashed: false,
    thumbnail: { icon: ScanLine, label: "Снимок", tone: "blue" },
    sections: [
      {
        id: "s1",
        heading: "1. Диагностика и планирование",
        kind: "bullet",
        items: [
          "Сбор анамнеза и осмотр пациента.",
          "КЛКТ обследование.",
          "Планирование в 3D-планировщике.",
          "Изготовление хирургического шаблона.",
        ],
        image: { icon: ScanLine, label: "Панорамный снимок", tone: "blue" },
      },
      {
        id: "s2",
        heading: "2. Хирургический этап",
        kind: "checklist",
        checklist: [
          { id: "s2c1", label: "Обезболивание и разрез.", done: true },
          { id: "s2c2", label: "Установка 6 имплантов (4 прямых + 2 под углом).", done: true },
          { id: "s2c3", label: "Проверка первичной стабильности.", done: true },
          { id: "s2c4", label: "Установка формирователей десны.", done: false },
          { id: "s2c5", label: "Наложение швов.", done: false },
        ],
        image: { icon: Bone, label: "Планирование имплантов", tone: "indigo" },
      },
      {
        id: "s3",
        heading: "3. Протезирование",
        kind: "numbered",
        items: [
          "Установка мультиюнитов.",
          "Снятие слепков.",
          "Изготовление временного протеза.",
          "Примерка и фиксация.",
        ],
        image: { icon: Smile, label: "Готовая улыбка", tone: "green" },
      },
    ],
    bottomChecklist: [
      { id: "b1", label: "Подготовить инструменты", done: true },
      { id: "b2", label: "Проверить импланты", done: true },
      { id: "b3", label: "Подготовить временный протез", done: true },
    ],
    idea: "Важно учитывать биотип десны и окклюзионную нагрузку. Проверить прикус через 2 недели.",
    attachmentCount: 7,
    attachments: [
      { id: "a1", label: "Снимок", tone: "blue" },
      { id: "a2", label: "Импланты", tone: "red" },
      { id: "a3", label: "Улыбка", tone: "green" },
    ],
    files: [
      { id: "f1", name: "Протокол All-on-6.pdf", size: "2.4 MB" },
      { id: "f2", name: "Шаблон планирования.stl", size: "12.8 MB" },
    ],
    links: {
      project: "Клиника 2026",
      task: "Подготовить материалы",
      event: { title: "Консультация пациента", dateLabel: "28 июля, 14:00" },
    },
    lastEditedLabel: "Сегодня, 13:42",
  },
  {
    id: "n2",
    title: "Идеи для нового проекта",
    description: "Несколько идей, которые хочу реализовать в ближайшее время…",
    icon: Lightbulb,
    color: "pink",
    tags: ["Идеи"],
    dateLabel: "Вчера, 18:20",
    starred: false,
    draft: true,
    archived: false,
    trashed: false,
    lastEditedLabel: "Вчера, 18:20",
  },
  {
    id: "n3",
    title: "Курс по имплантологии",
    description: "Список уроков и материалов для изучения.",
    icon: GraduationCap,
    color: "purple",
    tags: ["Обучение"],
    dateLabel: "Вчера, 11:15",
    starred: false,
    draft: false,
    archived: false,
    trashed: false,
    lastEditedLabel: "Вчера, 11:15",
  },
  {
    id: "n4",
    title: "Поездка в Грузию",
    description: "План поездки, места, которые хочу посетить и попробовать.",
    icon: Mountain,
    color: "teal",
    tags: ["Путешествия"],
    dateLabel: "12 авг., 09:30",
    starred: false,
    draft: false,
    archived: false,
    trashed: false,
    thumbnail: { icon: Mountain, label: "Горы", tone: "teal" },
    lastEditedLabel: "12 авг., 09:30",
  },
  {
    id: "n5",
    title: "Ежемесячный бюджет",
    description: "Планирование бюджета на август 2026 года.",
    icon: Wallet,
    color: "orange",
    tags: ["Финансы"],
    dateLabel: "10 авг., 21:10",
    starred: false,
    draft: false,
    archived: false,
    trashed: false,
    lastEditedLabel: "10 авг., 21:10",
  },
  {
    id: "n6",
    title: "Встреча с клиентом",
    description: "Обсудили новый проект и детали сотрудничества.",
    icon: Users,
    color: "blue",
    tags: ["Работа"],
    dateLabel: "9 авг., 10:05",
    starred: false,
    draft: false,
    archived: false,
    trashed: false,
    lastEditedLabel: "9 авг., 10:05",
  },
];

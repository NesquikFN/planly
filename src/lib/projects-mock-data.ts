import {
  BarChart3,
  BookOpen,
  Globe,
  Megaphone,
  Palette,
  Rocket,
  Search,
  Smartphone,
  Users,
} from "lucide-react";
import { USER_NAME } from "@/lib/app-constants";
import { computeMilestoneStatus } from "@/lib/projects";
import type {
  Project,
  ProjectActivityEntry,
  ProjectActivityType,
  ProjectFile,
  ProjectMember,
  ProjectMilestone,
  ProjectNote,
  ProjectPriority,
  ProjectTask,
  ProjectTaskPriority,
  ProjectTaskStatus,
} from "@/types/project";

// Static UI-only fixtures for the Projects module. Nothing here is a store —
// `createMockProjects()` is a pure factory so a later session can swap it for
// a real fetch/API call without touching any component: every consumer only
// ever sees the `Project[]` shape, never how it was produced.

function pick<T>(pool: readonly T[], seed: number): T {
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

function pickMany<T>(pool: readonly T[], seed: number, count: number): T[] {
  return Array.from({ length: count }, (_, index) => pick(pool, seed + index));
}

const TEAM_POOL: { name: string; role: string }[] = [
  { name: "Анна Смирнова", role: "Дизайнер" },
  { name: "Игорь Петров", role: "Frontend-разработчик" },
  { name: "Мария Ковалёва", role: "Backend-разработчик" },
  { name: "Дмитрий Орлов", role: "Продакт-менеджер" },
  { name: "Елена Волкова", role: "QA-инженер" },
  { name: "Сергей Никитин", role: "Маркетолог" },
];

const WORKLOAD_POOL = [85, 60, 40, 95, 55, 70, 30, 50, 75] as const;

const TAG_POOL = [
  "дизайн",
  "маркетинг",
  "бэкенд",
  "фронтенд",
  "исследование",
  "автоматизация",
  "контент",
  "партнёрство",
] as const;

const TODO_POOL = [
  "Собрать требования",
  "Составить бриф",
  "Изучить конкурентов",
  "Подготовить смету",
  "Согласовать сроки",
  "Написать техническое задание",
] as const;

const IN_PROGRESS_POOL = [
  "Разработать прототип",
  "Вёрстка главного экрана",
  "Настроить интеграцию",
  "Написать тексты",
  "Подключить аналитику",
] as const;

const REVIEW_POOL = [
  "Проверить вёрстку",
  "Ревью кода",
  "Тестирование сценариев",
  "Согласовать дизайн с командой",
] as const;

const DONE_POOL = [
  "Провести исследование рынка",
  "Собрать обратную связь",
  "Настроить репозиторий",
  "Согласовать бюджет",
  "Подготовить план проекта",
] as const;

const TASK_PRIORITY_POOL: ProjectTaskPriority[] = ["low", "medium", "high"];
const DUE_LABEL_POOL = ["5 авг", "12 авг", "20 авг", "1 сент", null, null] as const;

const NOTES_POOL: { title: string; excerpt: string }[] = [
  { title: "Идеи и заметки", excerpt: "Черновые мысли и идеи, которые пригодятся на следующих этапах." },
  { title: "Вопросы для обсуждения", excerpt: "Список открытых вопросов к следующей встрече с командой." },
  { title: "Полезные ссылки", excerpt: "Материалы, референсы и документация по проекту." },
  { title: "Обратная связь", excerpt: "Комментарии и правки от заинтересованных сторон." },
];

const FILES_POOL: { name: string; typeLabel: string; sizeLabel: string }[] = [
  { name: "Бриф проекта.pdf", typeLabel: "PDF", sizeLabel: "1.2 МБ" },
  { name: "Макеты.fig", typeLabel: "Figma", sizeLabel: "8.4 МБ" },
  { name: "Смета.xlsx", typeLabel: "Excel", sizeLabel: "340 КБ" },
  { name: "Презентация.pptx", typeLabel: "PowerPoint", sizeLabel: "5.1 МБ" },
  { name: "Техническое задание.docx", typeLabel: "Word", sizeLabel: "620 КБ" },
];

const TIME_LABEL_POOL = ["2 часа назад", "Вчера", "3 дня назад", "Неделю назад", "2 недели назад"] as const;

const MILESTONE_LABELS = ["Старт проекта", "Планирование и дизайн", "Разработка", "Тестирование", "Запуск"] as const;
const MILESTONE_DATE_POOL = ["Неделя 1", "Неделя 3", "Неделя 6", "Неделя 9", "Неделя 12"] as const;

const PRIORITY_POOL: ProjectPriority[] = ["medium", "high", "urgent", "low"];
const CREATED_AT_POOL = [
  "3 января 2026",
  "18 февраля 2026",
  "2 марта 2026",
  "25 марта 2026",
  "10 апреля 2026",
  "28 апреля 2026",
  "14 мая 2026",
  "30 мая 2026",
  "9 июня 2026",
] as const;

function buildMembers(projectId: string, seed: number): ProjectMember[] {
  const count = 2 + (seed % 3); // 2–4 teammates besides the owner
  const teammates = pickMany(TEAM_POOL, seed, count).map((person, index) => ({
    id: `${projectId}-m${index}`,
    name: person.name,
    role: person.role,
    workloadPercent: pick(WORKLOAD_POOL, seed + index),
  }));

  return [
    { id: `${projectId}-owner`, name: USER_NAME, role: "Владелец", workloadPercent: pick(WORKLOAD_POOL, seed), isOwner: true },
    ...teammates,
  ];
}

function buildTasks(projectId: string, seed: number, members: ProjectMember[]): ProjectTask[] {
  const columns: { status: ProjectTaskStatus; pool: readonly string[]; count: number }[] = [
    { status: "todo", pool: TODO_POOL, count: 2 + (seed % 2) },
    { status: "inProgress", pool: IN_PROGRESS_POOL, count: 1 + (seed % 2) },
    { status: "review", pool: REVIEW_POOL, count: 1 + ((seed + 1) % 2) },
    { status: "done", pool: DONE_POOL, count: 2 + ((seed + 1) % 2) },
  ];

  const tasks: ProjectTask[] = [];
  let cursor = 0;

  for (const column of columns) {
    const titles = pickMany(column.pool, seed + cursor, column.count);
    titles.forEach((title, index) => {
      const globalIndex = cursor + index;
      const assignee = globalIndex % 3 === 2 ? null : pick(members, seed + globalIndex);
      tasks.push({
        id: `${projectId}-t${globalIndex}`,
        title,
        status: column.status,
        priority: pick(TASK_PRIORITY_POOL, seed + globalIndex),
        assigneeId: assignee?.id ?? null,
        dueLabel: pick(DUE_LABEL_POOL, seed + globalIndex),
      });
    });
    cursor += column.count;
  }

  return tasks;
}

function buildNotes(projectId: string, seed: number): ProjectNote[] {
  return pickMany(NOTES_POOL, seed, 2 + (seed % 2)).map((note, index) => ({
    id: `${projectId}-n${index}`,
    title: note.title,
    excerpt: note.excerpt,
    updatedLabel: pick(TIME_LABEL_POOL, seed + index),
  }));
}

function buildFiles(projectId: string, seed: number): ProjectFile[] {
  return pickMany(FILES_POOL, seed, 2 + (seed % 3)).map((file, index) => ({
    id: `${projectId}-f${index}`,
    name: file.name,
    typeLabel: file.typeLabel,
    sizeLabel: file.sizeLabel,
    uploadedAtLabel: pick(TIME_LABEL_POOL, seed + index + 1),
    uploadedBy: pick(TEAM_POOL, seed + index).name,
  }));
}

function buildActivity(projectId: string, seed: number, projectName: string): ProjectActivityEntry[] {
  const templates: { type: ProjectActivityType; message: (actor: string) => string }[] = [
    { type: "created", message: () => `создал(а) проект «${projectName}»` },
    { type: "statusChanged", message: () => "обновил(а) статус проекта" },
    { type: "taskCompleted", message: () => `завершил(а) задачу «${pick(DONE_POOL, seed)}»` },
    { type: "memberAdded", message: () => "добавил(а) нового участника в команду" },
    { type: "fileUploaded", message: () => `загрузил(а) файл «${pick(FILES_POOL, seed).name}»` },
    { type: "commented", message: () => "оставил(а) комментарий к задаче" },
    { type: "updated", message: () => "обновил(а) описание проекта" },
  ];

  const entries = pickMany(templates, seed, 5);
  return entries.map((entry, index) => {
    const actor = index === 0 ? USER_NAME : pick(TEAM_POOL, seed + index).name;
    return {
      id: `${projectId}-a${index}`,
      type: entry.type,
      actor,
      message: entry.message(actor),
      timeLabel: pick(TIME_LABEL_POOL, seed + index),
    };
  });
}

function buildMilestones(projectId: string, progress: number): ProjectMilestone[] {
  const stageCount = MILESTONE_LABELS.length;

  return MILESTONE_LABELS.map((label, index) => ({
    id: `${projectId}-ms${index}`,
    label,
    dateLabel: MILESTONE_DATE_POOL[index],
    status: computeMilestoneStatus(index, stageCount, progress),
  }));
}

interface ProjectSeed {
  id: string;
  name: string;
  description: string;
  icon: Project["icon"];
  color: Project["color"];
  status: Project["status"];
  deadlineLabel: string;
  deadlineKey: string | null;
  starred: boolean;
}

const PROJECT_SEEDS: ProjectSeed[] = [
  {
    id: "p1",
    name: "Редизайн Planly",
    description: "Обновление интерфейса и системы компонентов приложения.",
    icon: Palette,
    color: "blue",
    status: "active",
    deadlineLabel: "12 авг",
    deadlineKey: "2026-08-12",
    starred: true,
  },
  {
    id: "p2",
    name: "Мобильное приложение",
    description: "Портирование основных сценариев планировщика на мобильные устройства.",
    icon: Smartphone,
    color: "purple",
    status: "active",
    deadlineLabel: "20 сент",
    deadlineKey: "2026-09-20",
    starred: false,
  },
  {
    id: "p3",
    name: "Маркетинговая кампания",
    description: "Запуск рекламной кампании к осеннему обновлению продукта.",
    icon: Megaphone,
    color: "orange",
    status: "active",
    deadlineLabel: "1 авг",
    deadlineKey: "2026-08-01",
    starred: false,
  },
  {
    id: "p4",
    name: "Исследование рынка",
    description: "Анализ конкурентов и опрос пользователей по ключевым сценариям.",
    icon: Search,
    color: "teal",
    status: "active",
    deadlineLabel: "30 авг",
    deadlineKey: "2026-08-30",
    starred: false,
  },
  {
    id: "p5",
    name: "Автоматизация отчётов",
    description: "Еженедельные отчёты по прогрессу собираются и рассылаются автоматически.",
    icon: BarChart3,
    color: "indigo",
    status: "active",
    deadlineLabel: "10 июля",
    deadlineKey: "2026-07-10",
    starred: false,
  },
  {
    id: "p6",
    name: "Сайт-визитка",
    description: "Лендинг с описанием продукта и формой обратной связи.",
    icon: Globe,
    color: "green",
    status: "completed",
    deadlineLabel: "1 июля",
    deadlineKey: "2026-07-01",
    starred: true,
  },
  {
    id: "p7",
    name: "Внутренняя база знаний",
    description: "Документация процессов и онбординг новых сотрудников.",
    icon: BookOpen,
    color: "pink",
    status: "completed",
    deadlineLabel: "15 июня",
    deadlineKey: "2026-06-15",
    starred: false,
  },
  {
    id: "p8",
    name: "Партнёрская программа",
    description: "Условия сотрудничества и первые переговоры с партнёрами.",
    icon: Users,
    color: "red",
    status: "onHold",
    deadlineLabel: "—",
    deadlineKey: null,
    starred: false,
  },
  {
    id: "p9",
    name: "Личный сайт",
    description: "Портфолио и блог — приостановлено до конца сезона.",
    icon: Rocket,
    color: "orange",
    status: "onHold",
    deadlineLabel: "—",
    deadlineKey: null,
    starred: false,
  },
];

function buildProject(seed: ProjectSeed, index: number): Project {
  const members = buildMembers(seed.id, index);
  const tasks = buildTasks(seed.id, index, members);
  const tasksDone = tasks.filter((task) => task.status === "done").length;
  const tasksTotal = tasks.length;
  const progress = seed.status === "completed" ? 100 : tasksTotal === 0 ? 0 : Math.round((tasksDone / tasksTotal) * 100);

  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    icon: seed.icon,
    color: seed.color,
    status: seed.status,
    priority: pick(PRIORITY_POOL, index),
    progress,
    tasksDone,
    tasksTotal,
    deadlineLabel: seed.deadlineLabel,
    deadlineKey: seed.deadlineKey,
    createdAtLabel: pick(CREATED_AT_POOL, index),
    starred: seed.starred,
    archived: false,
    tags: pickMany(TAG_POOL, index, 1 + (index % 3)),
    members,
    tasks,
    notes: buildNotes(seed.id, index),
    files: buildFiles(seed.id, index),
    activity: buildActivity(seed.id, index, seed.name),
    milestones: buildMilestones(seed.id, progress),
  };
}

export function createMockProjects(): Project[] {
  return PROJECT_SEEDS.map((seed, index) => buildProject(seed, index));
}

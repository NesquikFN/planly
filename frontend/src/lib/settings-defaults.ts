import {
  Bell,
  Calendar,
  CreditCard,
  Globe,
  Info,
  Lock,
  Palette,
  Plug,
  ShieldCheck,
  Sliders,
  User,
  type LucideIcon,
} from "lucide-react";
import type { SettingsCategoryKey, SettingsState } from "@/types/settings";

export interface SettingsCategoryDef {
  key: SettingsCategoryKey;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SETTINGS_CATEGORIES: SettingsCategoryDef[] = [
  { key: "profile", label: "Профиль", description: "Управляйте личными данными и настройками аккаунта", icon: User },
  { key: "appearance", label: "Внешний вид", description: "Тема, акцент, плотность и размер текста", icon: Palette },
  { key: "notifications", label: "Уведомления", description: "Каналы, типы уведомлений и тихие часы", icon: Bell },
  { key: "tasksProjects", label: "Задачи и проекты", description: "Значения по умолчанию для задач и проектов", icon: Sliders },
  { key: "calendar", label: "Календарь", description: "Отображение, события и часовой пояс", icon: Calendar },
  { key: "locale", label: "Язык и регион", description: "Язык интерфейса, форматы даты и валюта", icon: Globe },
  { key: "integrations", label: "Интеграции", description: "Подключённые сервисы и синхронизация", icon: Plug },
  { key: "privacy", label: "Приватность", description: "Кто видит вашу активность и данные", icon: Lock },
  { key: "security", label: "Безопасность", description: "Пароль, двухфакторная аутентификация, сеансы", icon: ShieldCheck },
  { key: "data", label: "Данные и экспорт", description: "Экспорт, резервное копирование и удаление данных", icon: CreditCard },
  { key: "plan", label: "Тариф", description: "Текущий план, лимиты и варианты подписки", icon: CreditCard },
  { key: "about", label: "О приложении", description: "Версия, лицензии и поддержка", icon: Info },
];

export const DEFAULT_SETTINGS: SettingsState = {
  profile: {
    firstName: "Александр",
    lastName: "Фёдоров",
    displayName: "Александр Фёдоров",
    email: "alex.fedorov@planly.app",
    phone: "+995 555 12 34 56",
    jobTitle: "Стоматолог-ортопед",
    company: "Planly Workspace",
    timezone: "GMT+4 (Тбилиси)",
    language: "ru",
    bio: "Занимаюсь имплантологией и протезированием, веду частную практику.",
    showEmail: true,
    showPhone: false,
    allowProjectInvites: true,
    status: "available",
  },
  appearance: {
    theme: "light",
    accent: "blue",
    density: "standard",
    textSize: "medium",
    sidebarShowLabels: true,
    sidebarAutoCollapse: false,
    sidebarShowCounts: true,
    sidebarPinProfile: true,
    animationsEnabled: true,
    reduceMotion: false,
    cardAppearAnimation: true,
  },
  notifications: {
    channels: { inApp: true, email: true, push: false, sound: true },
    typeChannels: {
      reminders: { inApp: true, email: false, push: false },
      dueSoon: { inApp: true, email: false, push: false },
      overdue: { inApp: true, email: true, push: false },
      comments: { inApp: true, email: false, push: false },
      projectChanges: { inApp: true, email: false, push: false },
      invitations: { inApp: true, email: true, push: false },
      weeklyReport: { inApp: false, email: true, push: false },
      achievements: { inApp: true, email: false, push: false },
      recommendations: { inApp: false, email: false, push: false },
    },
    dndEnabled: true,
    dndStart: "22:00",
    dndEnd: "08:00",
    dndDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    leadTimes: ["15m", "1h"],
  },
  tasksProjects: {
    defaultPriority: "medium",
    defaultDuration: "30m",
    defaultCategory: "Работа",
    reminderLeadTime: "15m",
    newTaskStatus: "В работе",
    autoAddToToday: true,
    showCompletedTasks: false,
    autoArchiveCompleted: true,
    confirmDelete: true,
    rescheduleOverdueToToday: false,

    projectDefaultView: "grid",
    projectDefaultSort: "По названию",
    showCompletedProjects: true,
    autoCalculateProgress: true,
    showArchiveAtBottom: true,

    weekStartsOn: "monday",
    workDays: ["mon", "tue", "wed", "thu", "fri"],
    workHoursStart: "09:00",
    workHoursEnd: "18:00",
    dailyTaskGoal: 8,
  },
  calendar: {
    defaultView: "week",
    weekStartsOn: "monday",
    workDayStart: "09:00",
    workDayEnd: "18:00",
    timeStep: 30,
    showWeekNumbers: false,
    showWeekends: true,
    showCompletedTasks: true,

    defaultEventColor: "blue",
    defaultEventDuration: "1h",
    defaultEventReminder: "15m",
    autoAddMeetLink: false,

    autoDetectTimezone: true,
    timezone: "GMT+4 (Тбилиси)",
    showSecondTimezone: false,
    secondTimezone: "GMT+3 (Москва)",
  },
  locale: {
    language: "Русский",
    region: "Грузия",
    dateFormat: "ДД.ММ.ГГГГ",
    timeFormat: "24h",
    weekStartsOn: "monday",
    measurementSystem: "metric",
    currency: "GEL",
  },
  integrations: {
    "google-calendar": { connected: true },
    "google-drive": { connected: false },
    gmail: { connected: false },
    slack: { connected: true },
    notion: { connected: false },
    outlook: { connected: false },
    telegram: { connected: true },
  },
  privacy: {
    showActivityStatus: true,
    showLastSeen: true,
    searchableByEmail: false,
    allowInvitesFromOthers: true,
    sendAnonymousStats: true,
    useDataForRecommendations: true,
    showAchievementsToOthers: false,
    visibility: "projectMembers",
  },
  backup: {
    autoBackup: true,
    frequency: "weekly",
    storage: "local",
    lastBackupLabel: "21 июля 2026, 03:00",
  },
};

export interface IntegrationDef {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  lastSync?: string;
  syncedData?: string;
}

export const INTEGRATIONS: IntegrationDef[] = [
  { key: "google-calendar", name: "Google Calendar", description: "Двусторонняя синхронизация событий", icon: Calendar, lastSync: "Сегодня, 09:12", syncedData: "События и приглашения" },
  { key: "google-drive", name: "Google Drive", description: "Хранение вложений и резервных копий", icon: Plug },
  { key: "gmail", name: "Gmail", description: "Создание задач и напоминаний из писем", icon: Plug },
  { key: "slack", name: "Slack", description: "Уведомления в рабочем пространстве", icon: Plug, lastSync: "Вчера, 18:40", syncedData: "Уведомления о задачах" },
  { key: "notion", name: "Notion", description: "Импорт заметок и документов", icon: Plug },
  { key: "outlook", name: "Microsoft Outlook", description: "Синхронизация календаря и контактов", icon: Plug },
  { key: "telegram", name: "Telegram", description: "Напоминания и ежедневная сводка", icon: Plug, lastSync: "Сегодня, 07:00", syncedData: "Напоминания" },
];

export interface SessionDef {
  id: string;
  device: string;
  browser: string;
  location: string;
  activity: string;
  current?: boolean;
}

export const MOCK_SESSIONS: SessionDef[] = [
  { id: "s1", device: "Windows", browser: "Chrome", location: "Батуми", activity: "сейчас", current: true },
  { id: "s2", device: "iPhone", browser: "Safari", location: "Батуми", activity: "2 часа назад" },
  { id: "s3", device: "MacBook", browser: "Chrome", location: "Тбилиси", activity: "5 дней назад" },
];

export interface LoginHistoryEntry {
  id: string;
  dateLabel: string;
  device: string;
  location: string;
  status: "success" | "failed";
}

export const LOGIN_HISTORY: LoginHistoryEntry[] = [
  { id: "l1", dateLabel: "Сегодня, 09:10", device: "Windows · Chrome", location: "Батуми", status: "success" },
  { id: "l2", dateLabel: "Вчера, 21:47", device: "iPhone · Safari", location: "Батуми", status: "success" },
  { id: "l3", dateLabel: "20 июля, 08:32", device: "MacBook · Chrome", location: "Тбилиси", status: "success" },
  { id: "l4", dateLabel: "18 июля, 23:05", device: "Неизвестное устройство", location: "Стамбул", status: "failed" },
  { id: "l5", dateLabel: "15 июля, 10:02", device: "Windows · Chrome", location: "Батуми", status: "success" },
];

export interface PlanDef {
  key: "free" | "pro" | "team";
  name: string;
  price: string;
  features: string[];
  limits: string[];
  recommended?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    key: "free",
    name: "Free",
    price: "0 GEL / мес",
    features: ["До 10 проектов", "1 ГБ хранилища", "Базовая аналитика"],
    limits: ["Без интеграций сверх лимита", "Без приоритетной поддержки"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "29 GEL / мес",
    features: ["Безлимитные проекты", "20 ГБ хранилища", "Полная аналитика", "До 10 интеграций"],
    limits: ["Для одного пользователя"],
    recommended: true,
  },
  {
    key: "team",
    name: "Team",
    price: "79 GEL / мес",
    features: ["Всё из Pro", "Совместные проекты", "100 ГБ хранилища", "Приоритетная поддержка"],
    limits: ["От 3 участников"],
  },
];

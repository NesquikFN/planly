import type { CalendarColor } from "@/types/calendar";

export type PresenceStatus = "available" | "busy" | "doNotDisturb" | "away";

export interface ProfileSettings {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  timezone: string;
  bio: string;
  showEmail: boolean;
  showPhone: boolean;
  allowProjectInvites: boolean;
  status: PresenceStatus;
}

export type ThemePreference = "light" | "dark" | "system";
export type AccentColor = "blue" | "purple" | "teal" | "green" | "orange";
export type Density = "compact" | "standard" | "spacious";
export type TextSize = "small" | "medium" | "large";

export interface AppearanceSettings {
  theme: ThemePreference;
  accent: AccentColor;
  density: Density;
  textSize: TextSize;
  sidebarShowLabels: boolean;
  sidebarAutoCollapse: boolean;
  sidebarShowCounts: boolean;
  sidebarPinProfile: boolean;
  animationsEnabled: boolean;
  reduceMotion: boolean;
  cardAppearAnimation: boolean;
}

export interface NotificationChannelsFlag {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export type NotificationTypeKey =
  | "reminders"
  | "dueSoon"
  | "overdue"
  | "comments"
  | "projectChanges"
  | "invitations"
  | "weeklyReport"
  | "achievements"
  | "recommendations";

export interface NotificationSettings {
  channels: NotificationChannelsFlag & { sound: boolean };
  typeChannels: Record<NotificationTypeKey, NotificationChannelsFlag>;
  dndEnabled: boolean;
  dndStart: string;
  dndEnd: string;
  dndDays: string[];
  leadTimes: string[];
}

export interface TaskProjectSettings {
  defaultPriority: "low" | "medium" | "high";
  defaultDuration: string;
  defaultCategory: string;
  reminderLeadTime: string;
  newTaskStatus: string;
  autoAddToToday: boolean;
  showCompletedTasks: boolean;
  autoArchiveCompleted: boolean;
  confirmDelete: boolean;
  rescheduleOverdueToToday: boolean;

  projectDefaultView: "grid" | "list";
  projectDefaultSort: string;
  showCompletedProjects: boolean;
  autoCalculateProgress: boolean;
  showArchiveAtBottom: boolean;

  weekStartsOn: "monday" | "sunday";
  workDays: string[];
  workHoursStart: string;
  workHoursEnd: string;
  dailyTaskGoal: number;
}

export interface CalendarSettingsData {
  defaultView: "day" | "week" | "month" | "agenda";
  weekStartsOn: "monday" | "sunday";
  workDayStart: string;
  workDayEnd: string;
  timeStep: 15 | 30 | 60;
  showWeekNumbers: boolean;
  showWeekends: boolean;
  showCompletedTasks: boolean;

  defaultEventColor: CalendarColor;
  defaultEventDuration: string;
  defaultEventReminder: string;
  autoAddMeetLink: boolean;

  autoDetectTimezone: boolean;
  timezone: string;
  showSecondTimezone: boolean;
  secondTimezone: string;
}

export interface LocaleSettings {
  language: string;
  region: string;
  dateFormat: string;
  timeFormat: "24h" | "12h";
  weekStartsOn: "monday" | "sunday";
  measurementSystem: "metric" | "imperial";
  currency: string;
}

export interface IntegrationConnection {
  connected: boolean;
}

export interface PrivacySettings {
  showActivityStatus: boolean;
  showLastSeen: boolean;
  searchableByEmail: boolean;
  allowInvitesFromOthers: boolean;
  sendAnonymousStats: boolean;
  useDataForRecommendations: boolean;
  showAchievementsToOthers: boolean;
  visibility: "onlyMe" | "projectMembers" | "allContacts";
}

export interface BackupSettings {
  autoBackup: boolean;
  frequency: "daily" | "weekly" | "monthly";
  storage: "local" | "googleDrive";
  lastBackupLabel: string;
}

export interface SettingsState {
  profile: ProfileSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  tasksProjects: TaskProjectSettings;
  calendar: CalendarSettingsData;
  locale: LocaleSettings;
  integrations: Record<string, IntegrationConnection>;
  privacy: PrivacySettings;
  backup: BackupSettings;
}

export type SettingsCategoryKey =
  | "profile"
  | "appearance"
  | "notifications"
  | "tasksProjects"
  | "calendar"
  | "locale"
  | "integrations"
  | "privacy"
  | "security"
  | "data"
  | "plan"
  | "about";

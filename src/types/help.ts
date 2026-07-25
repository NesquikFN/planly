import type { LucideIcon } from "lucide-react";

export type HelpQuickActionKey =
  | "getting-started"
  | "shortcuts"
  | "user-guide"
  | "video-tutorials"
  | "report-bug"
  | "suggest-feature";

export interface HelpQuickAction {
  key: HelpQuickActionKey;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HelpFaqSection {
  key: string;
  title: string;
  icon: LucideIcon;
  items: HelpFaqItem[];
}

export type HelpGuideKey =
  | "create-project"
  | "calendar-workflow"
  | "analytics-usage"
  | "export-data"
  | "import-data";

export type HelpGuideLevel = "Начальный" | "Средний" | "Продвинутый";

export interface HelpGuide {
  key: HelpGuideKey;
  title: string;
  description: string;
  duration: string;
  level: HelpGuideLevel;
  icon: LucideIcon;
}

export type SupportChannelKey = "email" | "telegram" | "discord" | "github";

export interface SupportChannel {
  key: SupportChannelKey;
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}

export type ServerStatusLevel = "operational" | "degraded" | "outage";

export interface ServerStatusItem {
  key: string;
  label: string;
  status: ServerStatusLevel;
}

export type FeedbackPriority = "low" | "medium" | "high";

export interface FeedbackPriorityOption {
  key: FeedbackPriority;
  label: string;
}

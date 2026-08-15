// Analytics domain model — every field here is meant to be derived from real
// Task / CalendarEvent / Project data by src/lib/analytics.ts. Nullable
// fields mark metrics that can be honestly "unknown" (not enough data) —
// components must render an explicit empty/neutral state for them instead
// of inventing a number.

export type AnalyticsPeriod = "week" | "month" | "quarter" | "year" | "all";

export type ProductivityMetric = "score" | "tasks" | "events" | "onTime";

export type TrendKind = "up" | "down" | "flat" | "new" | "none";

/**
 * Real percent-change vs. the previous period of equal length.
 * - "up"/"down"/"flat": previous > 0, percent is the real signed change.
 * - "flat": both periods are 0.
 * - "new": previous is 0 but current > 0 — there is no finite percentage, so
 *   `percent` stays null and the UI shows a safe label ("Новые данные")
 *   instead of "+Infinity%".
 * - "none": nothing to compare (e.g. no data at all).
 */
export interface Trend {
  kind: TrendKind;
  percent: number | null;
}

export interface DailyPoint {
  dateKey: string;
  label: string;
  tasksCompleted: number;
  tasksCreated: number;
  eventsCount: number;
  eventMinutes: number;
  /** Share of that day's due tasks completed on or before their due date. Null when no due tasks were completed that day. */
  onTimeRate: number | null;
  /** See computeActivityScore() in lib/analytics.ts for the formula. */
  activityScore: number;
}

export interface ScoreBreakdownItem {
  key: string;
  label: string;
  /** 0–100, or null when this component couldn't be evaluated. */
  value: number | null;
}

export interface ProductivityScoreData {
  /** 0–100, or null when there isn't enough data to score the period honestly. */
  score: number | null;
  maxScore: 100;
  trend: Trend;
  explanation: string;
  breakdown: ScoreBreakdownItem[];
}

export type MetricAccent = "green" | "blue" | "red" | "purple" | "amber";

export interface MetricCardData {
  key: string;
  label: string;
  value: string;
  helper: string;
  /** Icon name, resolved to a component in the UI layer — never a React node here. */
  icon: string;
  accent: MetricAccent;
}

export interface TaskPriorityBreakdownItem {
  key: string;
  label: string;
  count: number;
}

export interface TaskAnalyticsData {
  /** Due-date-scoped: tasks due in the period that are done. Partitions totalWithDueDate together with pending/overdue — used by the completion ring. */
  completed: number;
  pending: number;
  overdue: number;
  totalWithDueDate: number;
  /** Real completions during the period (by completedAt), regardless of whether the task has a due date — used for the headline "tasks completed" metric. */
  completedInPeriod: number;
  /** null when there are no due tasks in the period to compute a rate from. */
  completionPercent: number | null;
  priorityBreakdown: TaskPriorityBreakdownItem[];
}

export interface ProjectProgressItem {
  id: string;
  name: string;
  color: string;
  percent: number;
  tasksDone: number;
  tasksTotal: number;
}

export interface ProjectsAnalyticsData {
  /** False only when project data is intentionally unavailable to the caller. */
  available: boolean;
  total: number;
  active: number;
  completed: number;
  archived: number;
  mostActive: ProjectProgressItem | null;
  items: ProjectProgressItem[];
}

export interface DeadlineAnalyticsData {
  onTimePercent: number | null;
  previousPeriodPercent: number | null;
  /** Raw counts behind onTimePercent, for "X из Y" style labels. */
  onTimeCount: number;
  completedWithDueDate: number;
  averageLateLabel: string;
  mostDisciplinedDay: string | null;
  mostOverdueDay: string | null;
  weekdayOnTime: (number | null)[];
}

export interface CalendarTimeData {
  totalLabel: string;
  totalMinutes: number;
  trend: Trend;
  dailyMinutes: number[];
  bestDay: string | null;
  busiestHourLabel: string | null;
  averageEventLabel: string;
  eventsCount: number;
  hourHeatmap: number[][];
  hourLabels: string[];
}

export interface HeatmapDay {
  dateKey: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  intensity: number;
  tasksCompleted: number;
  activityScore: number;
}

export interface ActivityHeatmapData {
  currentStreak: number;
  bestStreak: number;
  activeDaysThisMonth: number;
  totalDaysThisMonth: number;
  monthLabel: string;
  days: HeatmapDay[];
}

export interface Goal {
  id: string;
  title: string;
  percent: number;
  detail: string;
  dueLabel: string;
  onTrack: boolean;
}

export type InsightSeverity = "positive" | "warning" | "info";

export interface InsightItem {
  id: string;
  text: string;
  severity: InsightSeverity;
}

export interface ImprovementItem {
  id: string;
  text: string;
  actionLabel: string;
  actionKey: string;
  severity: InsightSeverity;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  /** e.g. "6 из 10 задач" — always a real, computed progress statement, never a fabricated date. */
  progressLabel: string | null;
}

export interface WeeklySummaryData {
  text: string;
  highlights: { label: string; tone: "positive" | "negative" | "neutral" }[];
  planSteps: string[];
}

export interface AnalyticsData {
  periodLabel: string;
  /** True once the user has at least one task or event — gates the empty-state UI. */
  hasAnyData: boolean;
  score: ProductivityScoreData;
  metrics: MetricCardData[];
  chart: DailyPoint[];
  /** Same-length-as-possible series for the previous period, aligned by bucket index for the compare overlay. */
  previousChart: DailyPoint[];
  taskAnalytics: TaskAnalyticsData;
  projects: ProjectsAnalyticsData;
  deadlines: DeadlineAnalyticsData;
  calendarTime: CalendarTimeData;
  activity: ActivityHeatmapData;
  goals: Goal[];
  achievements: Achievement[];
  strengths: InsightItem[];
  improvements: ImprovementItem[];
  summary: WeeklySummaryData;
  today: { completed: number; total: number; eventsLabel: string; scorePercent: number | null };
  bestDay: { label: string; tasksDone: number } | null;
}

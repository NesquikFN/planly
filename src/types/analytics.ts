export type AnalyticsPeriod = "week" | "month" | "quarter" | "year";

export type ProductivityMetric = "score" | "tasks" | "focus" | "onTime";

export interface DailyPoint {
  label: string;
  score: number;
  prevScore: number;
  tasksCompleted: number;
  focusMinutes: number;
  onTimeRate: number;
}

export interface ScoreBreakdownItem {
  key: string;
  label: string;
  value: number;
}

export interface ProductivityScoreData {
  score: number;
  maxScore: number;
  deltaPercent: number;
  explanation: string;
  breakdown: ScoreBreakdownItem[];
}

export type MetricAccent = "green" | "blue" | "red" | "purple" | "amber";

export interface MetricCardData {
  key: string;
  label: string;
  value: string;
  helper: string;
  icon: string;
  accent: MetricAccent;
}

export interface TaskCategoryBreakdown {
  label: string;
  done: number;
  total: number;
}

export interface TaskAnalyticsData {
  completed: number;
  inProgress: number;
  overdue: number;
  cancelled: number;
  completionPercent: number;
  categories: TaskCategoryBreakdown[];
}

export interface ProjectProgressItem {
  id: string;
  name: string;
  color: string;
  percent: number;
  deltaPercent: number;
  tasksDone: number;
  tasksTotal: number;
}

export interface DeadlineAnalyticsData {
  onTimePercent: number;
  previousPeriodPercent: number;
  averageLateLabel: string;
  mostDisciplinedDay: string;
  mostOverdueDay: string;
  weekdayOnTime: number[];
}

export interface FocusAnalyticsData {
  totalLabel: string;
  deltaLabel: string;
  dailyMinutes: number[];
  bestDay: string;
  bestTimeWindow: string;
  averageSessionLabel: string;
  sessionsCompleted: number;
  hourHeatmap: number[][];
  hourLabels: string[];
}

export interface HeatmapDay {
  dateKey: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  intensity: number;
  tasksCompleted: number;
  focusMinutesLabel: string;
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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progressLabel?: string;
  note?: string;
}

export interface InsightItem {
  id: string;
  text: string;
}

export interface ImprovementItem {
  id: string;
  text: string;
  actionLabel: string;
  actionKey: string;
}

export interface WeeklySummaryData {
  text: string;
  highlights: { label: string; tone: "positive" | "negative" | "neutral" }[];
  planSteps: string[];
}

export interface AnalyticsData {
  periodLabel: string;
  score: ProductivityScoreData;
  metrics: MetricCardData[];
  chart: DailyPoint[];
  taskAnalytics: TaskAnalyticsData;
  projects: ProjectProgressItem[];
  deadlines: DeadlineAnalyticsData;
  focus: FocusAnalyticsData;
  activity: ActivityHeatmapData;
  goals: Goal[];
  goalsOnTrack: string;
  achievements: Achievement[];
  strengths: InsightItem[];
  improvements: ImprovementItem[];
  summary: WeeklySummaryData;
  today: { completed: number; total: number; focusLabel: string; scorePercent: number };
  bestDay: { label: string; score: number; tasksDone: number };
}

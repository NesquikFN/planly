import {
  addDays,
  addMonths,
  diffInCalendarDays,
  formatMonthLabel,
  formatMonthYear,
  formatShortDate,
  fromISODate,
  getLocalDateKey,
  getMonthGrid,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/date-utils";
import { timeToMinutes } from "@/lib/calendar-time";
import type { Task, TaskPriority } from "@/types/task";
import type { CalendarEvent } from "@/types/calendar";
import type { Project } from "@/types/project";
import type {
  Achievement,
  ActivityHeatmapData,
  AnalyticsData,
  AnalyticsPeriod,
  CalendarTimeData,
  DailyPoint,
  DeadlineAnalyticsData,
  Goal,
  HeatmapDay,
  ImprovementItem,
  InsightItem,
  MetricCardData,
  ProductivityScoreData,
  ProjectProgressItem,
  ProjectsAnalyticsData,
  ScoreBreakdownItem,
  TaskAnalyticsData,
  TaskPriorityBreakdownItem,
  Trend,
  WeeklySummaryData,
} from "@/types/analytics";

// Pure computation layer for Analytics — every function here takes real
// domain data (Task[], CalendarEvent[], Project[] | null) plus a period and
// "today", and returns a plain typed value. No React, no localStorage, no
// randomness: the same inputs always produce the same output.

export const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const PERIOD_NOUN_ACCUSATIVE: Record<AnalyticsPeriod, string> = {
  week: "неделю",
  month: "месяц",
  quarter: "квартал",
  year: "год",
  all: "всё время",
};

const PERIOD_NOUN_GENITIVE: Record<AnalyticsPeriod, string> = {
  week: "прошлой неделей",
  month: "прошлым месяцем",
  quarter: "прошлым кварталом",
  year: "прошлым годом",
  all: "прошлым периодом",
};

export function periodComparisonLabel(period: AnalyticsPeriod): string {
  return PERIOD_NOUN_GENITIVE[period];
}

export function getPeriodRangeLabel(period: AnalyticsPeriod, today: Date): string {
  if (period === "all") return "Всё время";
  if (period === "week") {
    const start = startOfWeekMonday(today);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const year = end.getFullYear();
    if (sameMonth) return `${start.getDate()}–${formatShortDate(end)} ${year} г.`;
    return `${formatShortDate(start)} – ${formatShortDate(end)} ${year} г.`;
  }
  if (period === "month") return formatMonthYear(today);
  if (period === "quarter") {
    const quarterIndex = Math.floor(today.getMonth() / 3);
    const startMonth = new Date(today.getFullYear(), quarterIndex * 3, 1);
    const endMonth = new Date(today.getFullYear(), quarterIndex * 3 + 2, 1);
    return `${formatMonthLabel(startMonth)} – ${formatMonthLabel(endMonth)} ${today.getFullYear()} г.`;
  }
  return `${today.getFullYear()} г.`;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  overdue: "Просрочено",
  important: "Важно",
  upcoming: "Скоро",
  none: "Без срока",
};
const PRIORITY_ORDER: TaskPriority[] = ["overdue", "important", "upcoming", "none"];

// --- Period ranges -----------------------------------------------------

interface PeriodBounds {
  start: Date;
  end: Date;
}

function currentBoundsFor(period: AnalyticsPeriod, today: Date): PeriodBounds {
  if (period === "week") {
    const start = startOfWeekMonday(today);
    return { start, end: addDays(start, 6) };
  }
  if (period === "month") {
    const start = startOfMonth(today);
    return { start, end: addDays(addMonths(start, 1), -1) };
  }
  if (period === "quarter") {
    const quarterIndex = Math.floor(today.getMonth() / 3);
    const start = new Date(today.getFullYear(), quarterIndex * 3, 1);
    return { start, end: addDays(addMonths(start, 3), -1) };
  }
  return { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 11, 31) };
}

function previousBoundsFor(period: AnalyticsPeriod, currentStart: Date): PeriodBounds {
  if (period === "week") {
    const start = addDays(currentStart, -7);
    return { start, end: addDays(start, 6) };
  }
  if (period === "month") {
    return { start: addMonths(currentStart, -1), end: addDays(currentStart, -1) };
  }
  if (period === "quarter") {
    return { start: addMonths(currentStart, -3), end: addDays(currentStart, -1) };
  }
  return { start: new Date(currentStart.getFullYear() - 1, 0, 1), end: new Date(currentStart.getFullYear() - 1, 11, 31) };
}

function enumerateDays(bounds: PeriodBounds): Date[] {
  const days: Date[] = [];
  let cursor = bounds.start;
  while (cursor.getTime() <= bounds.end.getTime()) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function keyOf(date: Date): string {
  return getLocalDateKey(date);
}

/**
 * A task's real deadline instant, local time. Date-only tasks deadline at the
 * end of that local day (23:59:59.999); date+time tasks deadline at that
 * exact local minute. Null when the task has no due date at all — such tasks
 * never participate in on-time/late deadline calculations.
 */
function taskDeadline(task: Task): Date | null {
  if (!task.date) return null;
  const deadline = fromISODate(task.date);
  if (task.time) {
    const [hours, minutes] = task.time.split(":").map(Number);
    deadline.setHours(hours, minutes, 0, 0);
  } else {
    deadline.setHours(23, 59, 59, 999);
  }
  return deadline;
}

/** True/false only for completed tasks with a real due date; null otherwise (excluded from the metric, never counted as either). */
function isCompletedOnTime(task: Task): boolean | null {
  if (!task.completed || !task.completedAt) return null;
  const deadline = taskDeadline(task);
  if (!deadline) return null;
  return new Date(task.completedAt).getTime() <= deadline.getTime();
}

// --- Real percent-change vs. the previous period (see types/analytics.ts) --

export function computeTrend(current: number, previous: number): Trend {
  if (previous > 0) {
    const percent = Math.round(((current - previous) / previous) * 100);
    if (percent > 0) return { kind: "up", percent };
    if (percent < 0) return { kind: "down", percent };
    return { kind: "flat", percent: 0 };
  }
  if (current === 0) return { kind: "flat", percent: 0 };
  return { kind: "new", percent: null };
}

function trendHelperText(trend: Trend, suffix: string): string {
  if (trend.kind === "new") return "Новые данные";
  if (trend.kind === "none") return "Нет данных за прошлый период";
  if (trend.kind === "flat") return `Без изменений ${suffix}`;
  const sign = (trend.percent ?? 0) > 0 ? "+" : "";
  return `${sign}${trend.percent}% ${suffix}`;
}

// --- Per-day aggregation of real domain data --------------------------

interface DayStats {
  tasksCompleted: number;
  tasksCreated: number;
  eventsCount: number;
  eventMinutes: number;
  onTimeCompleted: number;
  lateCompleted: number;
}

function emptyDayStats(): DayStats {
  return { tasksCompleted: 0, tasksCreated: 0, eventsCount: 0, eventMinutes: 0, onTimeCompleted: 0, lateCompleted: 0 };
}

/**
 * Single pass over real Task/CalendarEvent data, keyed by local date. This is
 * the only place instants (completedAt/createdAt, both ISO datetimes) get
 * converted to local calendar days — always via `new Date(iso)` + local
 * getters, never by slicing the ISO string, so nothing shifts by a day near
 * midnight in a non-UTC timezone.
 */
function buildDayStatsMap(tasks: Task[], events: CalendarEvent[]): Map<string, DayStats> {
  const map = new Map<string, DayStats>();
  function ensure(key: string): DayStats {
    let entry = map.get(key);
    if (!entry) {
      entry = emptyDayStats();
      map.set(key, entry);
    }
    return entry;
  }

  for (const task of tasks) {
    if (task.completed && task.completedAt) {
      const completedKey = keyOf(new Date(task.completedAt));
      const entry = ensure(completedKey);
      entry.tasksCompleted += 1;
      const onTime = isCompletedOnTime(task);
      if (onTime !== null) {
        if (onTime) entry.onTimeCompleted += 1;
        else entry.lateCompleted += 1;
      }
    }
    if (task.createdAt) {
      ensure(keyOf(new Date(task.createdAt))).tasksCreated += 1;
    }
  }

  for (const event of events) {
    const entry = ensure(event.date);
    entry.eventsCount += 1;
    entry.eventMinutes += Math.max(0, timeToMinutes(event.endTime) - timeToMinutes(event.startTime));
  }

  return map;
}

/**
 * Activity score for a single day — the one formula behind both the heatmap
 * intensity and the chart's "activity" series. Completed tasks are weighted
 * heaviest (3x) since finishing something is the strongest productivity
 * signal; a created task or a scheduled calendar event each count once as
 * lighter-weight signs of engagement.
 *
 *   activity = completedTasks * 3 + createdTasks + calendarEvents
 */
export function computeActivityScore(stats: Pick<DayStats, "tasksCompleted" | "tasksCreated" | "eventsCount">): number {
  return stats.tasksCompleted * 3 + stats.tasksCreated + stats.eventsCount;
}

function computeIntensity(score: number): number {
  if (score <= 0) return 0;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 7) return 3;
  return 4;
}

function sumRange(days: Date[], dayMap: Map<string, DayStats>): DayStats {
  const total = emptyDayStats();
  for (const day of days) {
    const stats = dayMap.get(keyOf(day));
    if (!stats) continue;
    total.tasksCompleted += stats.tasksCompleted;
    total.tasksCreated += stats.tasksCreated;
    total.eventsCount += stats.eventsCount;
    total.eventMinutes += stats.eventMinutes;
    total.onTimeCompleted += stats.onTimeCompleted;
    total.lateCompleted += stats.lateCompleted;
  }
  return total;
}

// --- Chart buckets (real sums, grouped to keep the chart readable) -----

interface ChartBucket {
  label: string;
  days: Date[];
}

function chartBuckets(period: AnalyticsPeriod, bounds: PeriodBounds): ChartBucket[] {
  const days = enumerateDays(bounds);

  if (period === "week") {
    return days.map((day) => ({ label: WEEKDAY_LABELS[(day.getDay() + 6) % 7], days: [day] }));
  }

  if (period === "month") {
    const buckets: ChartBucket[] = [];
    for (let i = 0; i < days.length; i += 7) {
      buckets.push({ label: `Нед ${buckets.length + 1}`, days: days.slice(i, i + 7) });
    }
    return buckets;
  }

  // quarter / year — group by calendar month
  const byMonth = new Map<string, Date[]>();
  for (const day of days) {
    const key = `${day.getFullYear()}-${day.getMonth()}`;
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(day);
    else byMonth.set(key, [day]);
  }
  return Array.from(byMonth.values()).map((bucketDays) => ({
    label: period === "year" ? formatMonthLabel(bucketDays[0]).slice(0, 3) : formatMonthLabel(bucketDays[0]),
    days: bucketDays,
  }));
}

function buildChart(period: AnalyticsPeriod, bounds: PeriodBounds, dayMap: Map<string, DayStats>): DailyPoint[] {
  return chartBuckets(period, bounds).map((bucket) => {
    const sum = sumRange(bucket.days, dayMap);
    const totalRated = sum.onTimeCompleted + sum.lateCompleted;
    return {
      dateKey: keyOf(bucket.days[0]),
      label: bucket.label,
      tasksCompleted: sum.tasksCompleted,
      tasksCreated: sum.tasksCreated,
      eventsCount: sum.eventsCount,
      eventMinutes: sum.eventMinutes,
      onTimeRate: totalRated > 0 ? Math.round((sum.onTimeCompleted / totalRated) * 100) : null,
      activityScore: computeActivityScore(sum),
    };
  });
}

// --- Task metrics --------------------------------------------------------

function tasksDueInRange(tasks: Task[], bounds: PeriodBounds): Task[] {
  const startKey = keyOf(bounds.start);
  const endKey = keyOf(bounds.end);
  return tasks.filter((task) => task.date && task.date >= startKey && task.date <= endKey);
}

// Tasks actually completed within the period, keyed by completion time —
// unlike tasksDueInRange(), this doesn't require a due date, so a task
// completed today still counts even if it was never given a `date` (the
// common case: createTaskFromText only sets `date` for "завтра" text).
function tasksCompletedInRange(tasks: Task[], bounds: PeriodBounds): Task[] {
  const startKey = keyOf(bounds.start);
  const endKey = keyOf(bounds.end);
  return tasks.filter((task) => {
    if (!task.completed || !task.completedAt) return false;
    const completedKey = keyOf(new Date(task.completedAt));
    return completedKey >= startKey && completedKey <= endKey;
  });
}

// The "Выполнение задач" card must never silently drop tasks that have no
// `date` — a due date is optional on Task (see types/task.ts), and plenty of
// real tasks are created without one. The period filter (tasksDueInRange)
// only makes sense for tasks that HAVE a date; date-less tasks are not "in"
// or "out of" any period, so they're added back in unconditionally as their
// own "Без срока" bucket instead of being excluded from the card entirely.
function computeTaskAnalytics(tasks: Task[], bounds: PeriodBounds, todayKey: string, period: AnalyticsPeriod): TaskAnalyticsData {
  const allActiveTasks = tasks;
  const datedTasksInPeriod = period === "all"
    ? allActiveTasks.filter((task) => !!task.date)
    : tasksDueInRange(allActiveTasks, bounds);
  const undatedTasks = allActiveTasks.filter((task) => !task.date);
  const analyticsTasks = [...datedTasksInPeriod, ...undatedTasks];

  const completed = analyticsTasks.filter((task) => task.completed).length;
  const overdue = analyticsTasks.filter((task) => !task.completed && !!task.date && task.date < todayKey).length;
  const pending = analyticsTasks.length - completed - overdue;
  const completionPercent = analyticsTasks.length > 0 ? Math.round((completed / analyticsTasks.length) * 100) : null;
  const completedInPeriod = period === "all" ? analyticsTasks.filter((task) => task.completed).length : tasksCompletedInRange(tasks, bounds).length;

  const counts = new Map<TaskPriority, number>();
  for (const task of analyticsTasks) counts.set(task.priority, (counts.get(task.priority) ?? 0) + 1);
  const priorityBreakdown: TaskPriorityBreakdownItem[] = PRIORITY_ORDER.map((key) => ({
    key,
    label: PRIORITY_LABELS[key],
    count: counts.get(key) ?? 0,
  }));

  return { completed, pending, overdue, totalWithDueDate: analyticsTasks.length, completedInPeriod, completionPercent, priorityBreakdown };
}

function onTimeRate(list: Task[]): number | null {
  if (list.length === 0) return null;
  const onTime = list.filter((task) => isCompletedOnTime(task) === true).length;
  return Math.round((onTime / list.length) * 100);
}

// Scoped by completedAt (when the task was actually finished), matching
// "Выполнено вовремя"/"Выполнено задач" — not by due date, which is what
// made this metric read "нет данных" even with real completed tasks: a task
// due outside the selected period but completed inside it belongs here.
function completedWithDeadlineIn(tasks: Task[], bounds: PeriodBounds, period: AnalyticsPeriod): Task[] {
  const candidates = period === "all" ? tasks.filter((task) => task.completed && task.completedAt) : tasksCompletedInRange(tasks, bounds);
  return candidates.filter((task) => !!task.date);
}

function computeDeadlineAnalytics(tasks: Task[], currentBounds: PeriodBounds, previousBounds: PeriodBounds, period: AnalyticsPeriod): DeadlineAnalyticsData {
  const currentCompleted = completedWithDeadlineIn(tasks, currentBounds, period);
  const previousCompleted = completedWithDeadlineIn(tasks, previousBounds, period);

  const onTimeCount = currentCompleted.filter((task) => isCompletedOnTime(task) === true).length;

  const lateOnes = currentCompleted.filter((task) => isCompletedOnTime(task) === false);
  let averageLateLabel = "—";
  if (lateOnes.length > 0) {
    const avgDays =
      lateOnes.reduce((sum, task) => {
        const dueDate = fromISODate(task.date!);
        const completedDate = fromISODate(keyOf(new Date(task.completedAt!)));
        return sum + diffInCalendarDays(completedDate, dueDate);
      }, 0) / lateOnes.length;
    averageLateLabel = avgDays < 1 ? "Менее суток" : `${Math.round(avgDays)} дн.`;
  }

  const weekdayBuckets: Task[][] = Array.from({ length: 7 }, () => []);
  for (const task of currentCompleted) {
    const weekdayIndex = (fromISODate(task.date!).getDay() + 6) % 7;
    weekdayBuckets[weekdayIndex].push(task);
  }
  const weekdayOnTime = weekdayBuckets.map((bucket) => onTimeRate(bucket));

  let mostDisciplinedDay: string | null = null;
  let mostOverdueDay: string | null = null;
  let bestRate = -1;
  let worstRate = 101;
  weekdayOnTime.forEach((value, index) => {
    if (value === null) return;
    if (value > bestRate) {
      bestRate = value;
      mostDisciplinedDay = WEEKDAY_LABELS[index];
    }
    if (value < worstRate) {
      worstRate = value;
      mostOverdueDay = WEEKDAY_LABELS[index];
    }
  });

  return {
    onTimePercent: onTimeRate(currentCompleted),
    previousPeriodPercent: onTimeRate(previousCompleted),
    onTimeCount,
    completedWithDueDate: currentCompleted.length,
    averageLateLabel,
    mostDisciplinedDay,
    mostOverdueDay,
    weekdayOnTime,
  };
}

// --- Calendar metrics ------------------------------------------------------

const HOUR_LABELS = Array.from({ length: 15 }, (_, index) => String(8 + index).padStart(2, "0"));

function formatMinutesLabel(minutes: number): string {
  if (minutes <= 0) return "0 мин";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} мин`;
  return mins === 0 ? `${hours} ч` : `${hours} ч ${mins} мин`;
}

function eventDurationMinutes(event: CalendarEvent): number {
  return Math.max(0, timeToMinutes(event.endTime) - timeToMinutes(event.startTime));
}

function computeCalendarTime(events: CalendarEvent[], currentBounds: PeriodBounds, previousBounds: PeriodBounds): CalendarTimeData {
  const currentStartKey = keyOf(currentBounds.start);
  const currentEndKey = keyOf(currentBounds.end);
  const previousStartKey = keyOf(previousBounds.start);
  const previousEndKey = keyOf(previousBounds.end);

  const currentEvents = events.filter((event) => event.date >= currentStartKey && event.date <= currentEndKey);
  const previousEvents = events.filter((event) => event.date >= previousStartKey && event.date <= previousEndKey);

  const totalMinutes = currentEvents.reduce((sum, event) => sum + eventDurationMinutes(event), 0);
  const previousMinutes = previousEvents.reduce((sum, event) => sum + eventDurationMinutes(event), 0);

  const dailyMinutes = Array.from({ length: 7 }, () => 0);
  for (const event of currentEvents) {
    dailyMinutes[(fromISODate(event.date).getDay() + 6) % 7] += eventDurationMinutes(event);
  }

  let bestDay: string | null = null;
  let bestMinutes = 0;
  dailyMinutes.forEach((minutes, index) => {
    if (minutes > bestMinutes) {
      bestMinutes = minutes;
      bestDay = WEEKDAY_LABELS[index];
    }
  });

  const hourHeatmap: number[][] = Array.from({ length: 7 }, () => Array(HOUR_LABELS.length).fill(0));
  const hourTotals = Array(HOUR_LABELS.length).fill(0);
  for (const event of currentEvents) {
    const dayIndex = (fromISODate(event.date).getDay() + 6) % 7;
    const hourIndex = Math.floor(timeToMinutes(event.startTime) / 60) - 8;
    if (hourIndex >= 0 && hourIndex < HOUR_LABELS.length) {
      hourHeatmap[dayIndex][hourIndex] = Math.min(4, hourHeatmap[dayIndex][hourIndex] + 1);
      hourTotals[hourIndex] += 1;
    }
  }

  let busiestHourLabel: string | null = null;
  let maxHourTotal = 0;
  hourTotals.forEach((total, index) => {
    if (total > maxHourTotal) {
      maxHourTotal = total;
      busiestHourLabel = `${HOUR_LABELS[index]}:00`;
    }
  });

  return {
    totalLabel: formatMinutesLabel(totalMinutes),
    totalMinutes,
    trend: computeTrend(totalMinutes, previousMinutes),
    dailyMinutes,
    bestDay,
    busiestHourLabel,
    averageEventLabel: currentEvents.length > 0 ? formatMinutesLabel(Math.round(totalMinutes / currentEvents.length)) : "—",
    eventsCount: currentEvents.length,
    hourHeatmap,
    hourLabels: HOUR_LABELS,
  };
}

// --- Activity heatmap (real streaks, current calendar month) -----------

function computeActivityHeatmap(dayMap: Map<string, DayStats>, today: Date): ActivityHeatmapData {
  const monthStart = startOfMonth(today);
  const grid = getMonthGrid(monthStart);
  const currentMonth = monthStart.getMonth();
  const todayKey = keyOf(today);

  const days: HeatmapDay[] = grid.map((day) => {
    const inCurrentMonth = day.getMonth() === currentMonth;
    const dateKey = keyOf(day);
    const stats = dayMap.get(dateKey);
    const activityScore = stats ? computeActivityScore(stats) : 0;
    return {
      dateKey,
      dayOfMonth: day.getDate(),
      inCurrentMonth,
      intensity: inCurrentMonth ? computeIntensity(activityScore) : 0,
      tasksCompleted: stats?.tasksCompleted ?? 0,
      activityScore,
    };
  });

  let currentStreak = 0;
  let cursor = today;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const stats = dayMap.get(keyOf(cursor));
    if (!stats || computeActivityScore(stats) <= 0) break;
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  let bestStreak = currentStreak;
  let running = 0;
  let previousDate: Date | null = null;
  for (const key of Array.from(dayMap.keys()).sort()) {
    const stats = dayMap.get(key)!;
    if (computeActivityScore(stats) <= 0) {
      running = 0;
      previousDate = null;
      continue;
    }
    const date = fromISODate(key);
    running = previousDate && diffInCalendarDays(date, previousDate) === 1 ? running + 1 : 1;
    bestStreak = Math.max(bestStreak, running);
    previousDate = date;
  }

  const activeDaysThisMonth = days.filter((day) => day.inCurrentMonth && day.dateKey <= todayKey && day.activityScore > 0).length;

  return {
    currentStreak,
    bestStreak,
    activeDaysThisMonth,
    totalDaysThisMonth: diffInCalendarDays(today, monthStart) + 1,
    monthLabel: formatMonthYear(monthStart),
    days,
  };
}

// --- Projects (only when a real ProjectsStore is reachable) ------------

function computeProjectsAnalytics(projects: Project[] | null): ProjectsAnalyticsData {
  if (!projects) {
    return { available: false, total: 0, active: 0, completed: 0, archived: 0, mostActive: null, items: [] };
  }

  const visible = projects.filter((project) => !project.archived);
  const items: ProjectProgressItem[] = visible.map((project) => ({
    id: project.id,
    name: project.name,
    color: project.color,
    percent: project.progress,
    tasksDone: project.tasksDone,
    tasksTotal: project.tasksTotal,
  }));
  const mostActive = [...items].sort((a, b) => b.tasksDone - a.tasksDone)[0] ?? null;

  return {
    available: true,
    total: visible.length,
    active: visible.filter((project) => project.status === "active").length,
    completed: visible.filter((project) => project.status === "completed").length,
    archived: projects.filter((project) => project.archived).length,
    mostActive,
    items,
  };
}

// --- Productivity score ---------------------------------------------------

/**
 * Productivity score (0–100) — a weighted blend of five real signals. Any
 * signal that can't be evaluated (no data) drops out and the remaining
 * weights are renormalized; if nothing can be evaluated the score is null.
 *
 *  - 35% task completion rate for the period (completed / due tasks)
 *  - 25% on-time completion rate (completed on or before the due date)
 *  - 15% "no overdue right now" bonus
 *  - 15% consistency (current activity streak, capped at 7 days = full marks)
 *  - 10% calendar planning (share of period days with ≥1 event)
 */
function computeProductivityScore(params: {
  completionPercent: number | null;
  onTimePercent: number | null;
  overdueNow: number;
  totalTasksNow: number;
  streak: number;
  periodDaysWithEvents: number;
  periodDayCount: number;
}): ProductivityScoreData {
  const { completionPercent, onTimePercent, overdueNow, totalTasksNow, streak, periodDaysWithEvents, periodDayCount } = params;

  const noOverdueValue = totalTasksNow > 0 ? (overdueNow === 0 ? 100 : Math.max(0, 100 - overdueNow * 20)) : null;
  const consistencyValue = Math.round(Math.min(1, streak / 7) * 100);
  const planningValue = periodDayCount > 0 ? Math.round((periodDaysWithEvents / periodDayCount) * 100) : null;

  const weights: Record<string, number> = { completion: 0.35, onTime: 0.25, noOverdue: 0.15, consistency: 0.15, planning: 0.1 };
  const breakdown: ScoreBreakdownItem[] = [
    { key: "completion", label: "Выполнение задач", value: completionPercent },
    { key: "onTime", label: "Соблюдение сроков", value: onTimePercent },
    { key: "noOverdue", label: "Без просрочек", value: noOverdueValue },
    { key: "consistency", label: "Регулярность", value: consistencyValue },
    { key: "planning", label: "Планирование в календаре", value: planningValue },
  ];

  const usable = breakdown.filter((item) => item.value !== null);
  if (usable.length === 0) {
    return {
      score: null,
      maxScore: 100,
      trend: { kind: "none", percent: null },
      explanation: "Недостаточно данных для точной оценки — добавьте и завершите несколько задач.",
      breakdown,
    };
  }

  const totalWeight = usable.reduce((sum, item) => sum + weights[item.key], 0);
  const weighted = usable.reduce((sum, item) => sum + (item.value as number) * weights[item.key], 0);
  const score = Math.max(0, Math.min(100, Math.round(weighted / totalWeight)));

  const explanationParts: string[] = [];
  if (completionPercent !== null) explanationParts.push(`выполнено ${completionPercent}% задач периода`);
  explanationParts.push(overdueNow === 0 ? "просроченных задач нет" : `просроченных задач: ${overdueNow}`);
  if (streak >= 2) explanationParts.push(`серия активности — ${streak} дн.`);

  return {
    score,
    maxScore: 100,
    trend: { kind: "none", percent: null },
    explanation: `Учтено: ${explanationParts.join(", ")}.`,
    breakdown,
  };
}

// --- Insights (rule-based, real conditions only) ------------------------

function buildInsights(params: {
  taskAnalytics: TaskAnalyticsData;
  completionTrend: Trend;
  deadlines: DeadlineAnalyticsData;
  overdueNow: number;
  importantPendingNow: number;
  streak: number;
  busiestCalendarDay: { label: string | null; count: number };
}): { strengths: InsightItem[]; improvements: ImprovementItem[] } {
  const strengths: InsightItem[] = [];
  const improvements: ImprovementItem[] = [];

  if (params.overdueNow > 0) {
    improvements.push({
      id: "overdue-tasks",
      text: `Сейчас ${params.overdueNow} просроченных задач.`,
      actionLabel: "Открыть задачи",
      actionKey: "open-tasks",
      severity: "warning",
    });
  }

  if (params.completionTrend.kind === "up") {
    strengths.push({
      id: "completion-up",
      text: `Процент выполнения задач вырос на ${params.completionTrend.percent}% по сравнению с прошлым периодом.`,
      severity: "positive",
    });
  } else if (params.completionTrend.kind === "down") {
    improvements.push({
      id: "completion-down",
      text: `Процент выполнения задач снизился на ${Math.abs(params.completionTrend.percent ?? 0)}% по сравнению с прошлым периодом.`,
      actionLabel: "Открыть задачи",
      actionKey: "open-tasks",
      severity: "warning",
    });
  }

  if (params.deadlines.mostDisciplinedDay) {
    strengths.push({
      id: "best-weekday",
      text: `${params.deadlines.mostDisciplinedDay} — день, когда вы чаще всего укладываетесь в срок.`,
      severity: "positive",
    });
  }

  if (params.importantPendingNow >= 3) {
    improvements.push({
      id: "important-pending",
      text: `${params.importantPendingNow} важных задач ещё не выполнены.`,
      actionLabel: "Открыть задачи",
      actionKey: "open-tasks",
      severity: "warning",
    });
  }

  if (params.busiestCalendarDay.label && params.busiestCalendarDay.count >= 4) {
    improvements.push({
      id: "busy-calendar-day",
      text: `${params.busiestCalendarDay.label} — самый загруженный день в календаре (${params.busiestCalendarDay.count} событий).`,
      actionLabel: "Открыть календарь",
      actionKey: "open-calendar",
      severity: "info",
    });
  }

  if (params.streak >= 3) {
    strengths.push({
      id: "active-streak",
      text: `Вы выполняете задачи ${params.streak} ${params.streak === 1 ? "день" : "дня"} подряд.`,
      severity: "positive",
    });
  }

  if (strengths.length === 0 && improvements.length === 0) {
    strengths.push({
      id: "not-enough-data",
      text: "Данных пока недостаточно для выводов — начните добавлять и выполнять задачи.",
      severity: "info",
    });
  }

  return { strengths: strengths.slice(0, 3), improvements: improvements.slice(0, 3) };
}

// --- Achievements (real, rule-based, no fabricated dates) ---------------

function progressLabel(current: number, target: number): string | null {
  return current >= target ? null : `${Math.min(current, target)} из ${target}`;
}

function computeAchievements(totalCompletedAllTime: number, bestStreak: number, overdueNow: number, totalTasksNow: number): Achievement[] {
  return [
    {
      id: "first-task",
      title: "Первая задача",
      description: "Выполните свою первую задачу",
      earned: totalCompletedAllTime >= 1,
      progressLabel: progressLabel(totalCompletedAllTime, 1),
    },
    {
      id: "ten-tasks",
      title: "10 задач",
      description: "Выполните 10 задач",
      earned: totalCompletedAllTime >= 10,
      progressLabel: progressLabel(totalCompletedAllTime, 10),
    },
    {
      id: "fifty-tasks",
      title: "50 задач",
      description: "Выполните 50 задач",
      earned: totalCompletedAllTime >= 50,
      progressLabel: progressLabel(totalCompletedAllTime, 50),
    },
    {
      id: "streak-3",
      title: "3 дня подряд",
      description: "Будьте активны 3 дня подряд",
      earned: bestStreak >= 3,
      progressLabel: progressLabel(bestStreak, 3),
    },
    {
      id: "streak-7",
      title: "Неделя подряд",
      description: "Будьте активны 7 дней подряд",
      earned: bestStreak >= 7,
      progressLabel: progressLabel(bestStreak, 7),
    },
    {
      id: "no-overdue",
      title: "Без просрочек",
      description: "Ни одной просроченной задачи прямо сейчас",
      earned: totalTasksNow > 0 && overdueNow === 0,
      progressLabel: totalTasksNow === 0 ? "Пока нет задач" : overdueNow === 0 ? null : `Просрочено: ${overdueNow}`,
    },
  ];
}

// --- Weekly summary (real template, no free-form fabrication) ----------

function pluralizeTasks(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "задач";
  if (mod10 === 1) return "задачу";
  if (mod10 >= 2 && mod10 <= 4) return "задачи";
  return "задач";
}

function buildSummary(
  period: AnalyticsPeriod,
  taskAnalytics: TaskAnalyticsData,
  completionTrend: Trend,
  eventsCount: number,
  bestDayLabel: string | null,
): WeeklySummaryData {
  const periodWord = PERIOD_NOUN_ACCUSATIVE[period];

  const text =
    taskAnalytics.completedInPeriod > 0
      ? [
          `За ${periodWord} вы выполнили ${taskAnalytics.completedInPeriod} ${pluralizeTasks(taskAnalytics.completedInPeriod)}` +
            (taskAnalytics.completionPercent !== null ? `, это ${taskAnalytics.completionPercent}% от запланированного на период.` : "."),
          taskAnalytics.overdue > 0 ? `Просроченных задач: ${taskAnalytics.overdue}.` : "Просроченных задач нет.",
          bestDayLabel ? `Лучший день — ${bestDayLabel}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      : `За ${periodWord} пока нет выполненных задач. Добавьте и завершите хотя бы одну, чтобы увидеть аналитику.`;

  const highlights: WeeklySummaryData["highlights"] = [];
  if (completionTrend.kind === "up") highlights.push({ label: `+${completionTrend.percent}% к выполнению`, tone: "positive" });
  if (completionTrend.kind === "down") highlights.push({ label: `${completionTrend.percent}% к выполнению`, tone: "negative" });
  if (taskAnalytics.overdue === 0 && taskAnalytics.completedInPeriod > 0) highlights.push({ label: "Нет просрочек", tone: "positive" });
  if (eventsCount > 0) highlights.push({ label: `${eventsCount} событий в календаре`, tone: "neutral" });

  const planSteps: string[] = [];
  if (taskAnalytics.overdue > 0) planSteps.push("Разобрать просроченные задачи");
  if (taskAnalytics.completionPercent !== null && taskAnalytics.completionPercent < 50) planSteps.push("Заложить больше времени на задачи периода");
  if (eventsCount === 0) planSteps.push("Добавить события в календарь для планирования дня");
  if (planSteps.length === 0) planSteps.push("Так держать — новых рекомендаций пока нет");

  return { text, highlights, planSteps };
}

// --- Orchestrator -----------------------------------------------------

export function computeAnalytics(tasks: Task[], events: CalendarEvent[], projects: Project[] | null, period: AnalyticsPeriod, today: Date): AnalyticsData {
  const todayKey = keyOf(today);
  const currentBounds = currentBoundsFor(period, today);
  const previousBounds = previousBoundsFor(period, currentBounds.start);

  const dayMap = buildDayStatsMap(tasks, events);
  const chart = buildChart(period, currentBounds, dayMap);
  const previousChart = buildChart(period, previousBounds, dayMap);

  const taskAnalytics = computeTaskAnalytics(tasks, currentBounds, todayKey, period);
  const deadlines = computeDeadlineAnalytics(tasks, currentBounds, previousBounds, period);
  const calendarTime = computeCalendarTime(events, currentBounds, previousBounds);
  const activity = computeActivityHeatmap(dayMap, today);
  const projectsData = computeProjectsAnalytics(projects);

  const overdueNow = tasks.filter((task) => !task.completed && task.date && task.date < todayKey).length;
  const totalTasksNow = tasks.length;
  const importantPendingNow = tasks.filter((task) => !task.completed && task.priority === "important").length;
  const totalCompletedAllTime = tasks.filter((task) => task.completed).length;

  const previousTaskAnalytics = computeTaskAnalytics(tasks, previousBounds, todayKey, period);
  const completionTrend = computeTrend(taskAnalytics.completionPercent ?? 0, previousTaskAnalytics.completionPercent ?? 0);
  const completedTrend = computeTrend(taskAnalytics.completedInPeriod, previousTaskAnalytics.completedInPeriod);
  const overdueTrend = computeTrend(taskAnalytics.overdue, previousTaskAnalytics.overdue);

  const periodDayCount = enumerateDays(currentBounds).length;
  const periodDaysWithEvents = enumerateDays(currentBounds).filter((day) => (dayMap.get(keyOf(day))?.eventsCount ?? 0) > 0).length;

  const score = computeProductivityScore({
    completionPercent: taskAnalytics.completionPercent,
    onTimePercent: deadlines.onTimePercent,
    overdueNow,
    totalTasksNow,
    streak: activity.currentStreak,
    periodDaysWithEvents,
    periodDayCount,
  });
  const previousScore = computeProductivityScore({
    completionPercent: previousTaskAnalytics.completionPercent,
    onTimePercent: deadlines.previousPeriodPercent,
    overdueNow,
    totalTasksNow,
    streak: activity.currentStreak,
    periodDaysWithEvents,
    periodDayCount,
  });
  if (score.score !== null && previousScore.score !== null) {
    score.trend = computeTrend(score.score, previousScore.score);
  }

  const metrics: MetricCardData[] = [
    {
      key: "completed",
      label: "Выполнено задач",
      value: String(taskAnalytics.completedInPeriod),
      helper: trendHelperText(completedTrend, "к прошлому периоду"),
      icon: "CheckCircle2",
      accent: "green",
    },
    {
      key: "onTime",
      label: "Выполнено вовремя",
      value: deadlines.onTimePercent !== null ? `${deadlines.onTimePercent}%` : "—",
      helper: deadlines.completedWithDueDate > 0 ? `${deadlines.onTimeCount} из ${deadlines.completedWithDueDate}` : "Нет данных за период",
      icon: "Clock",
      accent: "blue",
    },
    {
      key: "overdue",
      label: "Просрочено",
      value: String(taskAnalytics.overdue),
      helper: trendHelperText(overdueTrend, "к прошлому периоду"),
      icon: "AlertTriangle",
      accent: "red",
    },
    {
      key: "projects",
      label: "Активные проекты",
      value: projectsData.available ? String(projectsData.active) : "—",
      helper: projectsData.available ? `${projectsData.total} всего` : "Недоступно на этой странице",
      icon: "FolderKanban",
      accent: "purple",
    },
    {
      key: "calendarTime",
      label: "Время в календаре",
      value: calendarTime.totalLabel,
      helper: trendHelperText(calendarTime.trend, "к прошлому периоду"),
      icon: "Timer",
      accent: "amber",
    },
  ];

  let busiestCalendarDayLabel: string | null = null;
  let busiestCalendarDayCount = 0;
  {
    const startKey = keyOf(currentBounds.start);
    const endKey = keyOf(currentBounds.end);
    const perDay = new Map<string, number>();
    for (const event of events) {
      if (event.date < startKey || event.date > endKey) continue;
      perDay.set(event.date, (perDay.get(event.date) ?? 0) + 1);
    }
    for (const [dateKey, count] of perDay) {
      if (count > busiestCalendarDayCount) {
        busiestCalendarDayCount = count;
        busiestCalendarDayLabel = WEEKDAY_LABELS[(fromISODate(dateKey).getDay() + 6) % 7];
      }
    }
  }

  const { strengths, improvements } = buildInsights({
    taskAnalytics,
    completionTrend,
    deadlines,
    overdueNow,
    importantPendingNow,
    streak: activity.currentStreak,
    busiestCalendarDay: { label: busiestCalendarDayLabel, count: busiestCalendarDayCount },
  });

  const achievements = computeAchievements(totalCompletedAllTime, activity.bestStreak, overdueNow, totalTasksNow);

  const bestChartPoint = chart.length > 0 ? [...chart].sort((a, b) => b.activityScore - a.activityScore)[0] : null;
  const bestDay = bestChartPoint && bestChartPoint.activityScore > 0 ? { label: bestChartPoint.label, tasksDone: bestChartPoint.tasksCompleted } : null;

  const todayDueTasks = tasks.filter((task) => task.date === todayKey);
  const todayCompleted = todayDueTasks.filter((task) => task.completed).length;
  const todayEventsCount = events.filter((event) => event.date === todayKey).length;

  const summary = buildSummary(period, taskAnalytics, completionTrend, calendarTime.eventsCount, bestDay?.label ?? null);

  return {
    periodLabel: getPeriodRangeLabel(period, today),
    hasAnyData: tasks.length > 0 || events.length > 0,
    score,
    metrics,
    chart,
    previousChart,
    taskAnalytics,
    projects: projectsData,
    deadlines,
    calendarTime,
    activity,
    goals: [] as Goal[],
    achievements,
    strengths,
    improvements,
    summary,
    today: {
      completed: todayCompleted,
      total: todayDueTasks.length,
      eventsLabel: `${todayEventsCount}`,
      scorePercent: todayDueTasks.length > 0 ? Math.round((todayCompleted / todayDueTasks.length) * 100) : null,
    },
    bestDay,
  };
}

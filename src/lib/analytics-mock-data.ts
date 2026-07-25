import {
  addDays,
  diffInCalendarDays,
  formatMonthLabel,
  formatMonthYear,
  formatShortDate,
  getLocalDateKey,
  getMonthGrid,
  isSameDay,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/date-utils";
import type {
  Achievement,
  AnalyticsData,
  AnalyticsPeriod,
  DailyPoint,
  Goal,
  HeatmapDay,
  ImprovementItem,
  InsightItem,
  ProjectProgressItem,
} from "@/types/analytics";

export const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const PERIOD_MULTIPLIER: Record<AnalyticsPeriod, number> = {
  week: 1,
  month: 4.3,
  quarter: 13,
  year: 52,
};

const PERIOD_NOUN_ACCUSATIVE: Record<AnalyticsPeriod, string> = {
  week: "неделю",
  month: "месяц",
  quarter: "квартал",
  year: "год",
};

const PERIOD_NOUN_GENITIVE: Record<AnalyticsPeriod, string> = {
  week: "прошлой недели",
  month: "прошлого месяца",
  quarter: "прошлого квартала",
  year: "прошлого года",
};

export function periodNounAccusative(period: AnalyticsPeriod): string {
  return PERIOD_NOUN_ACCUSATIVE[period];
}

export function periodComparisonLabel(period: AnalyticsPeriod): string {
  return PERIOD_NOUN_GENITIVE[period];
}

export function getPeriodRangeLabel(period: AnalyticsPeriod, today: Date): string {
  if (period === "week") {
    const start = startOfWeekMonday(today);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const year = end.getFullYear();
    if (sameMonth) {
      return `${start.getDate()}–${formatShortDate(end)} ${year} г.`;
    }
    return `${formatShortDate(start)} – ${formatShortDate(end)} ${year} г.`;
  }
  if (period === "month") {
    return formatMonthYear(today);
  }
  if (period === "quarter") {
    const quarterIndex = Math.floor(today.getMonth() / 3);
    const startMonth = new Date(today.getFullYear(), quarterIndex * 3, 1);
    const endMonth = new Date(today.getFullYear(), quarterIndex * 3 + 2, 1);
    return `${formatMonthLabel(startMonth)} – ${formatMonthLabel(endMonth)} ${today.getFullYear()} г.`;
  }
  return `${today.getFullYear()} г.`;
}

// --- Base "week" dataset — matches the brief's exact figures. ---------------

const WEEK_SCORE = [68, 74, 81, 77, 91, 72, 82];
const WEEK_PREV_SCORE = [65, 70, 69, 75, 78, 64, 73];
const WEEK_TASKS = [5, 6, 7, 6, 8, 4, 6];
const WEEK_FOCUS_MIN = [130, 160, 200, 150, 250, 100, 130];
const WEEK_ON_TIME = [72, 84, 88, 86, 96, 90, 92];

function buildChartForPeriod(period: AnalyticsPeriod): DailyPoint[] {
  if (period === "week") {
    return WEEKDAY_LABELS.map((label, index) => ({
      label,
      score: WEEK_SCORE[index],
      prevScore: WEEK_PREV_SCORE[index],
      tasksCompleted: WEEK_TASKS[index],
      focusMinutes: WEEK_FOCUS_MIN[index],
      onTimeRate: WEEK_ON_TIME[index],
    }));
  }

  const labels =
    period === "month"
      ? ["Нед 1", "Нед 2", "Нед 3", "Нед 4"]
      : period === "quarter"
        ? ["Месяц 1", "Месяц 2", "Месяц 3"]
        : ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

  const bucketMultiplier = PERIOD_MULTIPLIER[period] / labels.length;

  return labels.map((label, index) => {
    // Deterministic gentle wave so each bucket looks organic but stable across renders.
    const wave = Math.sin(index * 1.3 + 0.6) * 6;
    const score = Math.round(74 + wave + (index % 3 === 0 ? 4 : 0));
    const prevScore = Math.round(score - 6 - Math.sin(index * 0.8) * 3);
    return {
      label,
      score: Math.max(50, Math.min(97, score)),
      prevScore: Math.max(45, Math.min(92, prevScore)),
      tasksCompleted: Math.round((WEEK_TASKS.reduce((a, b) => a + b, 0) / 7) * 7 * bucketMultiplier),
      focusMinutes: Math.round((WEEK_FOCUS_MIN.reduce((a, b) => a + b, 0) / 7) * 7 * bucketMultiplier),
      onTimeRate: Math.max(60, Math.min(97, Math.round(84 + wave / 2))),
    };
  });
}

function scale(base: number, period: AnalyticsPeriod, rounding: number = 1): number {
  return Math.round((base * PERIOD_MULTIPLIER[period]) / rounding) * rounding;
}

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} ч` : `${hours} ч ${mins} мин`;
}

const PROJECTS_BASE: ProjectProgressItem[] = [
  { id: "p1", name: "Новый сайт для клиники", color: "blue", percent: 60, deltaPercent: 12, tasksDone: 9, tasksTotal: 15 },
  { id: "p2", name: "Мобильное приложение", color: "purple", percent: 35, deltaPercent: 5, tasksDone: 5, tasksTotal: 14 },
  { id: "p3", name: "Маркетинговая кампания", color: "orange", percent: 20, deltaPercent: 8, tasksDone: 3, tasksTotal: 15 },
  { id: "p4", name: "Финансы и бюджет", color: "green", percent: 75, deltaPercent: 3, tasksDone: 12, tasksTotal: 16 },
  { id: "p5", name: "Личные цели", color: "teal", percent: 10, deltaPercent: 0, tasksDone: 1, tasksTotal: 10 },
];

const GOALS_BASE: Goal[] = [
  { id: "g1", title: "Завершить редизайн Planly", percent: 72, detail: "Осталось 8 задач", dueLabel: "15 августа", onTrack: true },
  { id: "g2", title: "Пройти курс по имплантологии", percent: 45, detail: "Осталось 11 уроков", dueLabel: "1 сентября", onTrack: true },
  { id: "g3", title: "Тренироваться 3 раза в неделю", percent: 67, detail: "Выполнено 2 из 3", dueLabel: "Текущая неделя", onTrack: false },
];

const ACHIEVEMENTS_BASE: Achievement[] = [
  { id: "a1", title: "Продуктивная неделя", description: "Выполнено более 40 задач", earned: true },
  {
    id: "a2",
    title: "Без просрочек",
    description: "Все задачи дня выполнены вовремя",
    earned: false,
    progressLabel: "Выполните все задачи дня вовремя, чтобы получить",
  },
  { id: "a3", title: "Фокус-мастер", description: "Более 4 часов фокусной работы за день", earned: true },
  {
    id: "a4",
    title: "Стабильность",
    description: "Активность 7 дней подряд",
    earned: true,
    note: "До «Месяц стабильности» осталось 9 дней",
  },
];

const STRENGTHS_BASE: InsightItem[] = [
  { id: "s1", text: "Вы хорошо выполняете задачи с высоким приоритетом — 92%." },
  { id: "s2", text: "Пятница является вашим самым продуктивным днём." },
  { id: "s3", text: "Вы стали на 12% чаще завершать задачи вовремя." },
  { id: "s4", text: "Проект «Новый сайт для клиники» продвинулся быстрее остальных." },
];

const IMPROVEMENTS_BASE: ImprovementItem[] = [
  {
    id: "i1",
    text: "В понедельник остаётся больше всего незавершённых задач.",
    actionLabel: "Перенести сложные задачи на утро",
    actionKey: "move-morning",
  },
  {
    id: "i2",
    text: "4 задачи были перенесены более двух раз.",
    actionLabel: "Открыть отложенные задачи",
    actionKey: "open-reminders",
  },
  {
    id: "i3",
    text: "Проект «Личные цели» не продвигался в течение недели.",
    actionLabel: "Запланировать следующий шаг",
    actionKey: "plan-step",
  },
  {
    id: "i4",
    text: "Вечерние задачи выполняются реже утренних.",
    actionLabel: "Изменить время напоминаний",
    actionKey: "open-reminders",
  },
];

function generateHourHeatmap(): number[][] {
  // rows = weekdays (Пн..Вс), cols = hour buckets 08..22
  return WEEKDAY_LABELS.map((_, dayIndex) =>
    Array.from({ length: 15 }, (_, hourIndex) => {
      const hour = 8 + hourIndex;
      const isPeakWindow = hour >= 10 && hour <= 13;
      const isFriday = dayIndex === 4;
      const isWeekend = dayIndex >= 5;
      let value = isPeakWindow ? 3 : hour >= 14 && hour <= 17 ? 2 : 1;
      if (isFriday && isPeakWindow) value = 4;
      if (isWeekend) value = Math.max(0, value - 2);
      if (hour === 8 || hour === 21 || hour === 22) value = Math.max(0, value - 1);
      return value;
    }),
  );
}

function generateActivityHeatmap(today: Date): { currentStreak: number; bestStreak: number; activeDaysThisMonth: number; totalDaysThisMonth: number; monthLabel: string; days: HeatmapDay[] } {
  const monthStart = startOfMonth(today);
  const grid = getMonthGrid(monthStart);
  const currentMonth = monthStart.getMonth();

  const days: HeatmapDay[] = grid.map((day) => {
    const inCurrentMonth = day.getMonth() === currentMonth;
    const dayOfMonth = day.getDate();
    const isToday = isSameDay(day, today);

    if (isToday) {
      return {
        dateKey: getLocalDateKey(day),
        dayOfMonth,
        inCurrentMonth,
        intensity: 4,
        tasksCompleted: 8,
        focusMinutesLabel: "3 ч 20 мин",
      };
    }

    if (!inCurrentMonth) {
      return { dateKey: getLocalDateKey(day), dayOfMonth, inCurrentMonth, intensity: 0, tasksCompleted: 0, focusMinutesLabel: "—" };
    }

    // Deterministic pseudo-organic pattern, stable across renders.
    const seed = (dayOfMonth * 11 + 5) % 9;
    const isRestDay = dayOfMonth % 9 === 0 && dayOfMonth !== new Date(today).getDate();
    const intensity = isRestDay ? 0 : Math.min(4, Math.max(1, Math.round(seed / 2)));
    const tasksCompleted = intensity === 0 ? 0 : intensity * 2 + (dayOfMonth % 3);
    const focusMinutes = intensity === 0 ? 0 : 40 + intensity * 35 + (dayOfMonth % 4) * 10;

    return {
      dateKey: getLocalDateKey(day),
      dayOfMonth,
      inCurrentMonth,
      intensity,
      tasksCompleted,
      focusMinutesLabel: focusMinutes === 0 ? "—" : formatHours(focusMinutes),
    };
  });

  return {
    currentStreak: 12,
    bestStreak: 21,
    activeDaysThisMonth: 22,
    totalDaysThisMonth: diffInCalendarDays(today, monthStart) + 1 <= 24 ? 24 : diffInCalendarDays(today, monthStart) + 1,
    monthLabel: formatMonthYear(monthStart),
    days,
  };
}

export function getAnalyticsData(period: AnalyticsPeriod, today: Date): AnalyticsData {
  const chart = buildChartForPeriod(period);
  const tasksCompletedTotal = chart.reduce((sum, point) => sum + point.tasksCompleted, 0);
  const focusMinutesTotal = chart.reduce((sum, point) => sum + point.focusMinutes, 0);

  const onTimeCount = scale(36, period);
  const overdueCount = scale(4, period);
  const activeProjects = period === "week" ? 5 : 5;

  return {
    periodLabel: getPeriodRangeLabel(period, today),
    score: {
      score: 82,
      maxScore: 100,
      deltaPercent: 12,
      explanation: "Вы выполнили больше задач в срок и сократили количество просрочек.",
      breakdown: [
        { key: "completion", label: "Выполнение задач", value: 88 },
        { key: "deadlines", label: "Соблюдение сроков", value: 76 },
        { key: "projects", label: "Прогресс проектов", value: 81 },
        { key: "consistency", label: "Регулярность", value: 84 },
      ],
    },
    metrics: [
      {
        key: "completed",
        label: "Выполнено задач",
        value: String(tasksCompletedTotal),
        helper: `+${scale(8, period)} к прошлому периоду`,
        icon: "CheckCircle2",
        accent: "green",
      },
      {
        key: "onTime",
        label: "Выполнено вовремя",
        value: "86%",
        helper: `${onTimeCount} из ${tasksCompletedTotal}`,
        icon: "Clock",
        accent: "blue",
      },
      {
        key: "overdue",
        label: "Просрочено",
        value: String(overdueCount),
        helper: `На ${scale(3, period)} меньше`,
        icon: "AlertTriangle",
        accent: "red",
      },
      {
        key: "activeProjects",
        label: "Активные проекты",
        value: String(activeProjects),
        helper: "2 проекта продвинулись",
        icon: "FolderKanban",
        accent: "purple",
      },
      {
        key: "focusTime",
        label: "Фокус-время",
        value: formatHours(focusMinutesTotal),
        helper: `+${formatHours(scale(135, period))}`,
        icon: "Timer",
        accent: "amber",
      },
    ],
    chart,
    taskAnalytics: {
      completed: scale(42, period),
      inProgress: scale(13, period),
      overdue: scale(4, period),
      cancelled: scale(3, period),
      completionPercent: 68,
      categories: [
        { label: "Работа", done: scale(18, period), total: scale(22, period) },
        { label: "Личное", done: scale(9, period), total: scale(12, period) },
        { label: "Здоровье", done: scale(6, period), total: scale(8, period) },
        { label: "Финансы", done: scale(5, period), total: scale(7, period) },
        { label: "Обучение", done: scale(4, period), total: scale(9, period) },
      ],
    },
    projects: PROJECTS_BASE,
    deadlines: {
      onTimePercent: 86,
      previousPeriodPercent: 74,
      averageLateLabel: "1 ч 20 мин",
      mostDisciplinedDay: "Пятница",
      mostOverdueDay: "Понедельник",
      weekdayOnTime: WEEK_ON_TIME,
    },
    focus: {
      totalLabel: formatHours(focusMinutesTotal),
      deltaLabel: `+${formatHours(scale(135, period))}`,
      dailyMinutes: chart.length === 7 ? WEEK_FOCUS_MIN : chart.map((p) => Math.round(p.focusMinutes / (chart.length / 7))),
      bestDay: "Пятница",
      bestTimeWindow: "10:00–13:00",
      averageSessionLabel: "48 минут",
      sessionsCompleted: scale(23, period),
      hourHeatmap: generateHourHeatmap(),
      hourLabels: ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"],
    },
    activity: generateActivityHeatmap(today),
    goals: GOALS_BASE,
    goalsOnTrack: "2 из 5 целей идут по плану",
    achievements: ACHIEVEMENTS_BASE,
    strengths: STRENGTHS_BASE,
    improvements: IMPROVEMENTS_BASE,
    summary: {
      text: `Это была продуктивная ${PERIOD_NOUN_ACCUSATIVE[period] === "неделю" ? "неделя" : PERIOD_NOUN_ACCUSATIVE[period]}. Вы выполнили ${scale(42, period)} задачи, продвинули ${scale(4, period)} проекта и сократили количество просрочек. Лучший результат был в пятницу. На следующий период стоит уделить внимание проекту «Личные цели» и уменьшить количество вечерних задач.`,
      highlights: [
        { label: "+12% к продуктивности", tone: "positive" },
        { label: `−${scale(3, period)} просроченные задачи`, tone: "positive" },
        { label: `+${formatHours(scale(135, period))} фокус-времени`, tone: "positive" },
      ],
      planSteps: [
        "Перенести 3 важные задачи на утро",
        "Запланировать один шаг по проекту «Личные цели»",
        "Оставить свободный резерв времени в понедельник",
        "Сохранить пятницу для глубокой работы",
      ],
    },
    today: { completed: 7, total: 10, focusLabel: "2 ч 40 мин", scorePercent: 78 },
    bestDay: { label: "Пятница", score: 91, tasksDone: 11 },
  };
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { ProductivityScore } from "@/components/analytics/ProductivityScore";
import { MetricCards } from "@/components/analytics/MetricCards";
import { ProductivityChart } from "@/components/analytics/ProductivityChart";
import { TaskAnalytics } from "@/components/analytics/TaskAnalytics";
import { ProjectProgress } from "@/components/analytics/ProjectProgress";
import { DeadlineAnalytics } from "@/components/analytics/DeadlineAnalytics";
import { FocusAnalytics } from "@/components/analytics/FocusAnalytics";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { GoalProgress } from "@/components/analytics/GoalProgress";
import { Achievements } from "@/components/analytics/Achievements";
import { PersonalInsights } from "@/components/analytics/PersonalInsights";
import { WeeklySummary } from "@/components/analytics/WeeklySummary";
import { WeeklyPlanModal } from "@/components/analytics/WeeklyPlanModal";
import { AnalyticsSidePanel } from "@/components/analytics/AnalyticsSidePanel";
import { useClock } from "@/hooks/useClock";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import { computeAnalytics } from "@/lib/analytics";
import { USER_NAME } from "@/lib/app-constants";
import type { AnalyticsPeriod, ImprovementItem } from "@/types/analytics";
import type { Task } from "@/types/task";

export default function AnalyticsPage() {
  const { today } = useClock();
  const router = useRouter();
  const { tasks } = useTasksStore();
  const { events } = useCalendarStore();
  const { items: archiveItems } = useArchiveStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [planOpen, setPlanOpen] = useState(false);
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  const taskAnalyticsRef = useRef<HTMLDivElement>(null);
  const projectProgressRef = useRef<HTMLDivElement>(null);
  const deadlineAnalyticsRef = useRef<HTMLDivElement>(null);
  const focusAnalyticsRef = useRef<HTMLDivElement>(null);

  // A completed task moves out of useTasksStore into the global Archive once
  // its undo window expires (see useTasksStore.completeTask) — without this,
  // "Выполнено" would silently drop back down as soon as that happens.
  // Archived tasks that were deleted (not completed) are intentionally
  // excluded: they shouldn't resurrect into "Всего"/"В работе".
  const archivedCompletedTasks = useMemo(
    () =>
      archiveItems
        .filter((item) => item.entityType === "task")
        .map((item) => item.originalData as Task)
        .filter((task) => task.completed),
    [archiveItems],
  );
  const tasksForAnalytics = useMemo(() => [...tasks, ...archivedCompletedTasks], [tasks, archivedCompletedTasks]);

  // ProjectsProvider is only mounted under /projects (see app/projects/layout.tsx) —
  // reading it here would crash, and mirroring its state would create a second
  // source of truth, so project metrics honestly report as unavailable instead.
  const data = useMemo(
    () => computeAnalytics(tasksForAnalytics, events, null, period, today),
    [tasksForAnalytics, events, period, today],
  );

  function handleStub(title: string, message?: string) {
    setStubDialog({ title, message });
  }

  function handleImprovementAction(item: ImprovementItem) {
    if (item.actionKey === "open-tasks") {
      router.push("/");
      return;
    }
    if (item.actionKey === "open-calendar") {
      router.push("/calendar");
      return;
    }
    handleStub("Скоро будет доступно", `«${item.actionLabel}» появится в одном из следующих обновлений.`);
  }

  function toggleMetricFocus(metricKey: string) {
    if (activeMetric === metricKey) {
      setActiveMetric(null);
      return;
    }

    setActiveMetric(metricKey);

    const target =
      metricKey === "completed" || metricKey === "overdue"
        ? taskAnalyticsRef.current
        : metricKey === "onTime"
          ? deadlineAnalyticsRef.current
          : metricKey === "projects"
            ? projectProgressRef.current
            : metricKey === "calendarTime"
              ? focusAnalyticsRef.current
              : null;

    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header
          userName={USER_NAME}
          onMenuClick={() => setSidebarOpen(true)}
          title="Аналитика"
          enableTaskSearch={false}
        />

        <main className="flex-1 space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
          <AnalyticsHeader
            period={period}
            onPeriodChange={setPeriod}
            periodLabel={data.periodLabel}
            compareEnabled={compareEnabled}
            onToggleCompare={() => setCompareEnabled((value) => !value)}
            onExport={() => handleStub("Отчёт готовится", "Экспорт отчёта появится в одном из следующих обновлений.")}
            onMoreSettings={() => handleStub("Скоро будет доступно", "Дополнительные настройки появятся позже.")}
            onCustomRange={() => handleStub("Скоро будет доступно", "Выбор собственного диапазона дат появится позже.")}
          />

          <ProductivityScore data={data.score} period={period} />

          <MetricCards
            metrics={data.metrics}
            activeMetric={activeMetric}
            onToggleMetric={toggleMetricFocus}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <ProductivityChart chart={data.chart} previousChart={data.previousChart} compareEnabled={compareEnabled} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div ref={taskAnalyticsRef} tabIndex={-1} className="scroll-mt-6 focus:outline-none">
                  <TaskAnalytics data={data.taskAnalytics} onOpenTasks={() => router.push("/")} />
                </div>
                <div ref={projectProgressRef} tabIndex={-1} className="scroll-mt-6 focus:outline-none">
                  <ProjectProgress data={data.projects} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div ref={deadlineAnalyticsRef} tabIndex={-1} className="scroll-mt-6 focus:outline-none">
                  <DeadlineAnalytics data={data.deadlines} />
                </div>
                <div ref={focusAnalyticsRef} tabIndex={-1} className="scroll-mt-6 focus:outline-none">
                  <FocusAnalytics data={data.calendarTime} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ActivityHeatmap data={data.activity} />
                <GoalProgress goals={data.goals} />
              </div>

              <Achievements achievements={data.achievements} />

              <PersonalInsights strengths={data.strengths} improvements={data.improvements} onAction={handleImprovementAction} />

              <WeeklySummary summary={data.summary} onOpenPlan={() => setPlanOpen(true)} />
            </div>

            <AnalyticsSidePanel
              data={data}
              onOpenTasks={() => router.push("/")}
              onOpenProjects={() => router.push("/projects")}
              onPlanWeek={() => setPlanOpen(true)}
              onExport={() => handleStub("Отчёт готовится", "Экспорт отчёта появится в одном из следующих обновлений.")}
            />
          </div>
        </main>
      </div>

      <WeeklyPlanModal open={planOpen} steps={data.summary.planSteps} onClose={() => setPlanOpen(false)} />

      <ComingSoonDialog
        open={stubDialog !== null}
        onClose={() => setStubDialog(null)}
        title={stubDialog?.title ?? ""}
        message={stubDialog?.message}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
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
import { getAnalyticsData } from "@/lib/analytics-mock-data";
import { USER_NAME } from "@/lib/app-constants";
import type { AnalyticsPeriod } from "@/types/analytics";
import type { ImprovementItem } from "@/types/analytics";

export default function AnalyticsPage() {
  const { today } = useClock();
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [planOpen, setPlanOpen] = useState(false);
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);

  const data = useMemo(() => getAnalyticsData(period, today), [period, today]);

  function handleStub(title: string, message?: string) {
    setStubDialog({ title, message });
  }

  function handleImprovementAction(item: ImprovementItem) {
    if (item.actionKey === "open-reminders") {
      router.push("/reminders");
      return;
    }
    handleStub("Скоро будет доступно", `«${item.actionLabel}» появится в одном из следующих обновлений.`);
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

          <MetricCards metrics={data.metrics} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <ProductivityChart data={data.chart} compareEnabled={compareEnabled} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TaskAnalytics data={data.taskAnalytics} />
                <ProjectProgress projects={data.projects} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DeadlineAnalytics data={data.deadlines} />
                <FocusAnalytics data={data.focus} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ActivityHeatmap data={data.activity} />
                <GoalProgress goals={data.goals} onTrackLabel={data.goalsOnTrack} />
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

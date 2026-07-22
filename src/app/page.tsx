"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { TaskListCard } from "@/components/dashboard/TaskListCard";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { TodayCalendarCard } from "@/components/dashboard/TodayCalendarCard";
import { BottomInput } from "@/components/ai/BottomInput";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";
import { CompletedTaskToast } from "@/components/tasks/CompletedTaskToast";
import { CompletedTasksList } from "@/components/tasks/CompletedTasksList";
import { useTasksStore } from "@/hooks/useTasksStore";
import { todayEvents, weeklyProgress } from "@/lib/mock-data";
import { USER_NAME, TODAY_LABEL } from "@/lib/app-constants";

export default function DashboardPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { view, focusDisplay } = useTasksStore();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header
          userName={USER_NAME}
          date={TODAY_LABEL}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 space-y-6 px-4 pb-32 sm:px-6 lg:px-8">
          {view === "dashboard" ? (
            <>
              <StatsRow />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TaskListCard />
                </div>

                <div className="flex flex-col gap-6">
                  <FocusCard focus={focusDisplay} />
                  <ProgressCard progress={weeklyProgress} />
                  <TodayCalendarCard events={todayEvents} />
                </div>
              </div>
            </>
          ) : (
            <CompletedTasksList />
          )}
        </main>
      </div>

      <CompletedTaskToast />
      <BottomInput />
      <TaskEditModal />
    </div>
  );
}

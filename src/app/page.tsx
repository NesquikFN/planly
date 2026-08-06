"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { TaskListCard } from "@/components/dashboard/TaskListCard";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { TodayCalendarCard } from "@/components/dashboard/TodayCalendarCard";
import { TaskEditModal } from "@/components/tasks/TaskEditModal";
import { CompletedTaskToast } from "@/components/tasks/CompletedTaskToast";
import { CompletedTasksList } from "@/components/tasks/CompletedTasksList";
import { useTasksStore } from "@/hooks/useTasksStore";
import { USER_NAME } from "@/lib/app-constants";

export default function DashboardPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { view } = useTasksStore();

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-canvas">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header userName={USER_NAME} onMenuClick={() => setSidebarOpen(true)} />

        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
          {view === "dashboard" ? (
            <>
              <StatsRow />

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <TaskListCard />
                </div>

                <div className="flex flex-col gap-4 lg:w-[360px] lg:shrink-0">
                  <StreakCard />
                  <TodayCalendarCard />
                </div>
              </div>
            </>
          ) : (
            <CompletedTasksList />
          )}
        </main>
      </div>

      <CompletedTaskToast />
      <TaskEditModal />
    </div>
  );
}

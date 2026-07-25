"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { CalendarSidebarPanel } from "@/components/calendar/CalendarSidebarPanel";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { CalendarViewTransition } from "@/components/calendar/CalendarViewTransition";
import { DayView } from "@/components/calendar/DayView";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import { AgendaView } from "@/components/calendar/AgendaView";
import { EventDetailsPanel } from "@/components/calendar/EventDetailsPanel";
import { EventModal } from "@/components/calendar/EventModal";
import { CalendarFormModal } from "@/components/calendar/CalendarFormModal";
import { DeleteCalendarDialog } from "@/components/calendar/DeleteCalendarDialog";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { USER_NAME } from "@/lib/app-constants";

function CalendarMain() {
  const { viewMode, goToPrevious, goToNext } = useCalendarStore();

  const swipeRef = useSwipeNavigation<HTMLDivElement>(
    useCallback(() => goToNext(), [goToNext]),
    useCallback(() => goToPrevious(), [goToPrevious]),
  );

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <CalendarToolbar />

      <div ref={swipeRef} className="overflow-hidden">
        <CalendarViewTransition>
          {viewMode === "day" && <DayView />}
          {viewMode === "week" && <WeekView />}
          {viewMode === "month" && <MonthView />}
          {viewMode === "agenda" && <AgendaView />}
        </CalendarViewTransition>
      </div>

      {(viewMode === "day" || viewMode === "week") && <EventDetailsPanel />}
    </section>
  );
}

function CalendarPageContent() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header userName={USER_NAME} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <CalendarSidebarPanel />
            <CalendarMain />
          </div>
        </main>
      </div>

      <EventModal />
      <CalendarFormModal />
      <DeleteCalendarDialog />
    </div>
  );
}

export default function CalendarPage() {
  return <CalendarPageContent />;
}

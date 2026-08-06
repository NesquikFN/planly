"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { CalendarViewTransition } from "@/components/calendar/CalendarViewTransition";
import { DayView } from "@/components/calendar/DayView";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import { AgendaView } from "@/components/calendar/AgendaView";
import { DayDetailPanel } from "@/components/calendar/DayDetailPanel";
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
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/8 dark:bg-surface lg:h-full">
      <CalendarToolbar />

      <div ref={swipeRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CalendarViewTransition>
          {viewMode === "day" && <DayView />}
          {viewMode === "week" && <WeekView />}
          {viewMode === "month" && <MonthView />}
          {viewMode === "agenda" && <AgendaView />}
        </CalendarViewTransition>
      </div>
    </section>
  );
}

function CalendarPageContent() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-canvas lg:h-screen lg:overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:h-full lg:overflow-hidden lg:pl-64">
        <Header userName={USER_NAME} onMenuClick={() => setSidebarOpen(true)} />

        {/* Locked to the viewport only at lg+ (desktop, where the time grid
            should feel like an app pane with one internal scrollbar, not a
            page). Below lg it stays the normal, naturally-scrolling page
            every other route uses — unchanged mobile behavior. */}
        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pb-8 sm:px-6 lg:min-h-0 lg:overflow-hidden lg:px-8 lg:pb-4">
          <div className="flex flex-1 flex-col gap-6 lg:h-full lg:min-h-0 lg:flex-row lg:items-stretch">
            <CalendarMain />
            <DayDetailPanel />
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

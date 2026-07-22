import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { CalendarList } from "@/components/calendar/CalendarList";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";

export function CalendarSidebarPanel() {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <MiniCalendar />
      <div className="border-t border-gray-100 pt-4">
        <CalendarList />
      </div>
      <div className="border-t border-gray-100 pt-4">
        <UpcomingEvents />
      </div>
    </section>
  );
}

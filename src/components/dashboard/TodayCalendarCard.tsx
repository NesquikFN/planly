import { ArrowRight } from "lucide-react";
import type { CalendarEventItem, EventColor } from "@/types/event";

interface TodayCalendarCardProps {
  events: CalendarEventItem[];
}

const dotStyles: Record<EventColor, string> = {
  orange: "bg-amber-400",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
};

export function TodayCalendarCard({ events }: TodayCalendarCardProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Сегодня в календаре</h3>

      <ul className="mt-3 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="flex items-center gap-2.5 text-sm">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyles[event.color]}`} />
            <span className="shrink-0 tabular-nums text-gray-400">{event.time}</span>
            <span className="truncate text-gray-700">{event.title}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
      >
        Открыть календарь
        <ArrowRight size={14} />
      </button>
    </section>
  );
}

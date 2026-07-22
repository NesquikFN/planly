"use client";

import { Plus } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { calendarButtonBase, calendarButtonIdle, calendarButtonSelected, calendarIconButton } from "@/lib/calendar-button-styles";
import { UPCOMING_PREVIEW_COUNT } from "@/lib/calendar-constants";
import { cn } from "@/lib/utils";

export function UpcomingEvents() {
  const { upcomingEvents, upcomingTotalCount, upcomingExpanded, toggleUpcomingExpanded, openCreateModal } =
    useCalendarStore();

  const preview = upcomingEvents.slice(0, UPCOMING_PREVIEW_COUNT);
  const rest = upcomingEvents.slice(UPCOMING_PREVIEW_COUNT);
  const canToggle = upcomingTotalCount > UPCOMING_PREVIEW_COUNT;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Предстоящие</h3>
        <button
          type="button"
          onClick={() => openCreateModal()}
          aria-label="Добавить событие"
          className={calendarIconButton}
        >
          <Plus size={16} />
        </button>
      </div>

      {upcomingEvents.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">Нет предстоящих событий</p>
      ) : (
        <>
          <ul className="mt-2 space-y-3">
            {preview.map(({ event, dateLabel }) => (
              <UpcomingItem key={event.id} title={event.title} dateLabel={dateLabel} calendarId={event.calendarId} />
            ))}
          </ul>

          {rest.length > 0 && (
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-in-out",
                upcomingExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <ul className="mt-3 space-y-3">
                  {rest.map(({ event, dateLabel }) => (
                    <UpcomingItem key={event.id} title={event.title} dateLabel={dateLabel} calendarId={event.calendarId} />
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {canToggle && (
        <button
          type="button"
          onClick={toggleUpcomingExpanded}
          className={cn(
            calendarButtonBase,
            "mt-3 px-2 py-1 text-sm",
            upcomingExpanded ? calendarButtonSelected : calendarButtonIdle,
          )}
        >
          {upcomingExpanded ? "Скрыть" : "Показать все"}
        </button>
      )}
    </div>
  );
}

function UpcomingItem({
  title,
  dateLabel,
  calendarId,
}: {
  title: string;
  dateLabel: string;
  calendarId: string;
}) {
  const { calendarById } = useCalendarStore();
  const resolvedColor = calendarById.get(calendarId)?.color ?? "blue";
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${calendarColorStyles[resolvedColor].dot}`} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900">{title}</p>
        <p className="truncate text-xs text-gray-400">{dateLabel}</p>
      </div>
    </li>
  );
}

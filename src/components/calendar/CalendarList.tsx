"use client";

import { MoreVertical, Plus } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { calendarIconButton } from "@/lib/calendar-button-styles";
import { DropdownMenu } from "@/components/ui/DropdownMenu";

export function CalendarList() {
  const { calendars, toggleCalendarVisibility, openCreateCalendarForm, openEditCalendarForm, requestDeleteCalendar } =
    useCalendarStore();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Мои календари</h3>
        <button
          type="button"
          onClick={openCreateCalendarForm}
          aria-label="Создать календарь"
          className={calendarIconButton}
        >
          <Plus size={15} />
        </button>
      </div>

      <ul className="mt-2 space-y-1">
        {calendars.map((calendar) => {
          const styles = calendarColorStyles[calendar.color];

          return (
            <li key={calendar.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={calendar.visible}
                onChange={() => toggleCalendarVisibility(calendar.id)}
                aria-label={`Показать календарь «${calendar.name}»`}
                className={`h-4 w-4 shrink-0 rounded border-gray-300 ${styles.accent} focus:ring-0`}
              />
              <span className="flex-1 truncate text-sm text-gray-600 dark:text-gray-300">{calendar.name}</span>

              <DropdownMenu
                trigger={<MoreVertical size={14} />}
                triggerClassName={calendarIconButton}
                triggerAriaLabel="Действия с календарём"
                items={[
                  { key: "rename", label: "Переименовать", onSelect: () => openEditCalendarForm(calendar.id) },
                  { key: "recolor", label: "Изменить цвет", onSelect: () => openEditCalendarForm(calendar.id) },
                  {
                    key: "toggle",
                    label: calendar.visible ? "Скрыть" : "Показать",
                    onSelect: () => toggleCalendarVisibility(calendar.id),
                  },
                  {
                    key: "delete",
                    label: "Удалить",
                    onSelect: () => requestDeleteCalendar(calendar.id),
                    destructive: true,
                    disabled: calendars.length <= 1,
                  },
                ]}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

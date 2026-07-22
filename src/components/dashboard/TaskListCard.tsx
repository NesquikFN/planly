"use client";

import { ArrowUpDown, ListFilter, MoreVertical } from "lucide-react";
import { TaskRow } from "@/components/tasks/TaskRow";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useTasksStore } from "@/hooks/useTasksStore";
import { filterOptions, sortOptions } from "@/lib/filters";

export function TaskListCard() {
  const { visibleTasks, activeFilter, setActiveFilter, sortKey, setSortKey } = useTasksStore();

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">Все задачи</h2>
        <div className="flex items-center gap-1.5">
          <DropdownMenu
            trigger={
              <>
                <ListFilter size={15} />
                Фильтр
              </>
            }
            triggerClassName="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
            items={filterOptions.map((option) => ({
              key: option.key,
              label: option.label,
              active: activeFilter === option.key,
              onSelect: () => setActiveFilter(option.key),
            }))}
          />
          <DropdownMenu
            trigger={
              <>
                <ArrowUpDown size={15} />
                Сортировка
              </>
            }
            triggerClassName="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
            items={sortOptions.map((option) => ({
              key: option.key,
              label: option.label,
              active: sortKey === option.key,
              onSelect: () => setSortKey(option.key),
            }))}
          />
          <button
            type="button"
            aria-label="Ещё"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <ul className="mt-2 divide-y divide-gray-100">
        {visibleTasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </ul>

      {visibleTasks.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">Ничего не найдено</p>
      )}

      <p className="pt-4 text-center text-sm text-gray-400">{visibleTasks.length} задач</p>
    </section>
  );
}

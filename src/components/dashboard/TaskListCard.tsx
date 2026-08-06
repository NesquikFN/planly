"use client";

import { ArrowUpDown, CheckCircle2, ListChecks, ListFilter, MoreVertical, Plus, Target, X } from "lucide-react";
import { TaskRow } from "@/components/tasks/TaskRow";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { BottomInput } from "@/components/ai/BottomInput";
import { useTasksStore } from "@/hooks/useTasksStore";
import { filterOptions, sortOptions } from "@/lib/filters";

// Focus used to be its own card in the right column — folded in here so
// "today's one task that matters" reads as part of the list it's drawn
// from, not a separate widget. No store changes: same focusStatus/
// clearFocus/setManualFocus this always used.
function FocusStrip() {
  const { focusStatus, clearFocus } = useTasksStore();
  if (focusStatus.kind === "empty") return null;

  const isDone = focusStatus.kind === "completed";
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
      {isDone ? <CheckCircle2 size={15} className="shrink-0 text-emerald-500" /> : <Target size={15} className="shrink-0 text-accent" />}
      <span className={`min-w-0 flex-1 truncate ${isDone ? "text-gray-400 line-through dark:text-ink-faint" : "text-gray-700 dark:text-ink-dim"}`}>
        {isDone ? "Фокус выполнен — " : "Фокус дня — "}
        {focusStatus.task.title}
      </span>
      <button
        type="button"
        onClick={clearFocus}
        aria-label="Убрать фокус"
        className="shrink-0 text-gray-300 hover:text-gray-500 dark:text-ink-faint dark:hover:text-ink-dim"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function TaskListCard() {
  const { visibleTasks, activeFilter, setActiveFilter, sortKey, setSortKey, error, focusStatus } = useTasksStore();
  const focusTaskId = focusStatus.kind !== "empty" ? focusStatus.task.id : null;

  return (
    <section className="flex min-h-[560px] flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface sm:p-6">
      {error && <p className="mb-3 text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Все задачи</h2>
        <div className="flex items-center gap-1.5">
          <DropdownMenu
            trigger={
              <>
                <ListFilter size={15} />
                Фильтр
              </>
            }
            triggerClassName="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50 dark:text-ink-dim dark:hover:bg-surface-2"
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
            triggerClassName="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50 dark:text-ink-dim dark:hover:bg-surface-2"
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
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <FocusStrip />

      {visibleTasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 dark:bg-surface-2 dark:text-ink-faint">
            <ListChecks size={24} />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
              <Plus size={14} />
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-ink">У вас пока нет задач</p>
            <p className="mt-1 max-w-[240px] text-sm text-gray-400 dark:text-ink-faint">
              {activeFilter === "all"
                ? "Добавьте первую задачу или просто напишите, что нужно сделать"
                : "По выбранному фильтру задач нет"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-2 flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-white/8">
            {visibleTasks.map((task) => (
              <TaskRow key={task.id} task={task} isFocus={task.id === focusTaskId} />
            ))}
          </ul>
          <p className="pt-4 text-center text-sm text-gray-400 dark:text-ink-faint">{visibleTasks.length} задач</p>
        </>
      )}

      <div className="mt-4 shrink-0">
        <BottomInput />
      </div>
    </section>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { RemindersToolbar, type RemindersViewMode } from "@/components/reminders/RemindersToolbar";
import { RemindersStatsRow } from "@/components/reminders/RemindersStatsRow";
import { RemindersGroupedList } from "@/components/reminders/RemindersGroupedList";
import { RemindersScheduleView } from "@/components/reminders/RemindersScheduleView";
import { RemindersInfoPanel } from "@/components/reminders/RemindersInfoPanel";
import { ReminderFormModal, type ReminderFormValues } from "@/components/reminders/ReminderFormModal";
import { useClock } from "@/hooks/useClock";
import { createMockReminders, QUICK_FILTERS } from "@/lib/reminders-mock-data";
import { applySnooze, groupReminders, matchesQuickFilter, type ReminderSortKey, sortReminders } from "@/lib/reminders";
import { USER_NAME } from "@/lib/app-constants";
import type { Reminder, ReminderCategory, ReminderRepeat, QuickFilterKey, ReminderPriority } from "@/types/reminder";

export default function RemindersPage() {
  const { now, today, todayKey } = useClock();
  const router = useRouter();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(() => createMockReminders(now));

  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey>("all");
  const [activeCategory, setActiveCategory] = useState<ReminderCategory | null>(null);
  const [activeRepeat, setActiveRepeat] = useState<ReminderRepeat | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<ReminderPriority | null>(null);
  const [sortKey, setSortKey] = useState<ReminderSortKey>("time");
  const [viewMode, setViewMode] = useState<RemindersViewMode>("list");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  function handleQuickFilterChange(filter: QuickFilterKey) {
    setActiveQuickFilter(filter);
    setSelectedDateKey(null);
  }

  function handleSelectDate(dateKey: string) {
    setSelectedDateKey((current) => (current === dateKey ? null : dateKey));
  }

  const visibleReminders = useMemo(() => {
    let list = reminders;

    if (selectedDateKey) {
      list = list.filter((reminder) => reminder.date === selectedDateKey);
    } else {
      list = list.filter((reminder) => matchesQuickFilter(reminder, activeQuickFilter, now, todayKey));
    }

    if (activeCategory) list = list.filter((reminder) => reminder.category === activeCategory);
    if (activeRepeat) list = list.filter((reminder) => reminder.repeat === activeRepeat);
    if (priorityFilter) list = list.filter((reminder) => reminder.priority === priorityFilter);

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (reminder) =>
          reminder.title.toLowerCase().includes(query) || (reminder.description ?? "").toLowerCase().includes(query),
      );
    }

    return sortReminders(list, sortKey);
  }, [reminders, selectedDateKey, activeQuickFilter, activeCategory, activeRepeat, priorityFilter, searchQuery, sortKey, now, todayKey]);

  const groups = useMemo(() => {
    const isCompletedFilter = activeQuickFilter === "completed" && !selectedDateKey;
    if (isCompletedFilter) {
      return visibleReminders.length > 0 ? [{ key: "completed", label: "Выполненные", reminders: visibleReminders }] : [];
    }
    return groupReminders(visibleReminders, now);
  }, [visibleReminders, now, activeQuickFilter, selectedDateKey]);

  const statCounts = useMemo(() => {
    const byKey = (key: QuickFilterKey) => QUICK_FILTERS.find((filter) => filter.key === key)?.count ?? 0;
    return {
      today: byKey("today"),
      upcoming: byKey("upcoming"),
      overdue: byKey("overdue"),
      completed: byKey("completed"),
    };
  }, []);

  function toggleComplete(id: string) {
    setReminders((prev) =>
      prev.map((reminder) => {
        if (reminder.id !== id) return reminder;
        const completed = !reminder.completed;
        return { ...reminder, completed, completedLabel: completed ? "Только что" : undefined };
      }),
    );
  }

  function toggleStar(id: string) {
    setReminders((prev) => prev.map((reminder) => (reminder.id === id ? { ...reminder, starred: !reminder.starred } : reminder)));
  }

  function handleSnooze(id: string, option: Parameters<typeof applySnooze>[1]) {
    setReminders((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, ...applySnooze(reminder, option, now) } : reminder)),
    );
  }

  function handleDelete(id: string) {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  }

  function toggleCollapse(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openNewReminderModal() {
    setEditingReminder(null);
    setFormOpen(true);
  }

  function openEditReminderModal(reminder: Reminder) {
    setEditingReminder(reminder);
    setFormOpen(true);
  }

  function handleFormSubmit(values: ReminderFormValues) {
    const links: Reminder["links"] = {};
    if (values.linkProject.trim()) links.project = values.linkProject.trim();
    if (values.linkTask.trim()) links.task = values.linkTask.trim();
    if (values.linkNote.trim()) links.note = values.linkNote.trim();
    if (values.linkEvent.trim()) links.event = values.linkEvent.trim();
    const hasLinks = Object.keys(links).length > 0;

    if (editingReminder) {
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === editingReminder.id
            ? {
                ...reminder,
                title: values.title.trim(),
                description: values.description.trim() || undefined,
                date: values.date || undefined,
                time: values.date ? values.time || undefined : undefined,
                category: values.category,
                priority: values.priority,
                repeat: values.repeat,
                leadTime: values.leadTime,
                links: hasLinks ? links : undefined,
              }
            : reminder,
        ),
      );
    } else {
      const newReminder: Reminder = {
        id: `r-${Date.now()}`,
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        date: values.date || undefined,
        time: values.date ? values.time || undefined : undefined,
        category: values.category,
        priority: values.priority,
        repeat: values.repeat,
        leadTime: values.leadTime,
        completed: false,
        starred: false,
        links: hasLinks ? links : undefined,
      };
      setReminders((prev) => [newReminder, ...prev]);
    }

    setFormOpen(false);
    setEditingReminder(null);
  }

  function handleQuickAction(action: string) {
    setStubDialog({ title: "Скоро будет доступно", message: `«${action}» появится в одном из следующих обновлений.` });
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-gray-950">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        remindersExtras={{
          activeQuickFilter,
          onQuickFilterChange: handleQuickFilterChange,
          activeCategory,
          onCategoryChange: setActiveCategory,
          activeRepeat,
          onRepeatChange: setActiveRepeat,
          onNewReminder: openNewReminderModal,
        }}
      />

      <div className="flex h-screen flex-col lg:pl-64">
        <Header
          userName={USER_NAME}
          onMenuClick={() => setSidebarOpen(true)}
          title="Напоминания"
          enableTaskSearch={false}
          onSearchIconClick={() => searchInputRef.current?.focus()}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 sm:px-6 lg:px-8">
          <RemindersToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onMoreSettings={() =>
              setStubDialog({ title: "Скоро будет доступно", message: "Дополнительные настройки появятся позже." })
            }
            searchInputRef={searchInputRef}
          />

          <RemindersStatsRow {...statCounts} />

          <div className="grid flex-1 grid-cols-[1fr_300px] items-start gap-6">
            <div>
              {viewMode === "list" ? (
                <RemindersGroupedList
                  groups={groups}
                  now={now}
                  today={today}
                  collapsedKeys={collapsedGroups}
                  onToggleCollapse={toggleCollapse}
                  onToggleComplete={toggleComplete}
                  onToggleStar={toggleStar}
                  onSnooze={handleSnooze}
                  onEdit={openEditReminderModal}
                  onDelete={handleDelete}
                />
              ) : (
                <RemindersScheduleView
                  reminders={visibleReminders}
                  now={now}
                  today={today}
                  onToggleComplete={toggleComplete}
                  onToggleStar={toggleStar}
                  onSnooze={handleSnooze}
                  onEdit={openEditReminderModal}
                  onDelete={handleDelete}
                />
              )}
            </div>

            <RemindersInfoPanel
              reminders={reminders}
              now={now}
              today={today}
              selectedDateKey={selectedDateKey}
              onSelectDate={handleSelectDate}
              onToggleComplete={toggleComplete}
              onSnooze={handleSnooze}
              onEdit={openEditReminderModal}
              onQuickAction={handleQuickAction}
              onCreateReminder={openNewReminderModal}
              onOpenCalendar={() => router.push("/calendar")}
            />
          </div>
        </main>
      </div>

      <ReminderFormModal
        open={formOpen}
        initial={editingReminder}
        onClose={() => {
          setFormOpen(false);
          setEditingReminder(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ComingSoonDialog
        open={stubDialog !== null}
        onClose={() => setStubDialog(null)}
        title={stubDialog?.title ?? ""}
        message={stubDialog?.message}
      />
    </div>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { RemindersToolbar } from "@/components/reminders/RemindersToolbar";
import { RemindersStatsRow } from "@/components/reminders/RemindersStatsRow";
import { RemindersGroupedList } from "@/components/reminders/RemindersGroupedList";
import { RemindersScheduleView } from "@/components/reminders/RemindersScheduleView";
import { RemindersInfoPanel } from "@/components/reminders/RemindersInfoPanel";
import { ReminderFormModal, type ReminderFormValues } from "@/components/reminders/ReminderFormModal";
import { ReminderEventModal, type ReminderEventDefaults } from "@/components/reminders/ReminderEventModal";
import { useRemindersStore } from "@/hooks/useRemindersStore";
import { USER_NAME } from "@/lib/app-constants";
import type { QuickFilterKey, Reminder, ReminderDraft } from "@/types/reminder";

interface EventCreatorRequest {
  defaults: ReminderEventDefaults;
  onCreated: (eventId: string) => void;
}

function reminderToDraft(reminder: Reminder, links: NonNullable<Reminder["links"]>): ReminderDraft {
  return {
    title: reminder.title,
    description: reminder.description,
    date: reminder.date,
    time: reminder.time,
    category: reminder.category,
    priority: reminder.priority,
    repeat: reminder.repeat,
    leadTime: reminder.leadTime,
    links: Object.keys(links).length > 0 ? links : undefined,
  };
}

function RemindersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    now,
    today,
    reminders,
    visibleReminders,
    groups,
    stats,
    nextReminder,
    activeQuickFilter,
    setActiveQuickFilter,
    selectedDateKey,
    toggleSelectedDate,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    sortKey,
    setSortKey,
    viewMode,
    setViewMode,
    collapsedGroups,
    toggleCollapsedGroup,
    createReminder,
    updateReminder,
    toggleComplete,
    toggleStar,
    postponeReminder,
    deleteReminder,
  } = useRemindersStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<Partial<ReminderFormValues> | undefined>();
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [eventCreator, setEventCreator] = useState<EventCreatorRequest | null>(null);
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("create") !== "1" || searchParams.get("relationType") !== "note") return;
    const relationId = searchParams.get("relationId") ?? "";
    const relationLabel = searchParams.get("relationLabel") ?? "";
    if (!relationId) return;
    setEditingReminder(null);
    setCreateDefaults({ title: searchParams.get("title") ?? relationLabel, linkNote: relationId, linkNoteLabel: relationLabel });
    setFormOpen(true);
    router.replace("/reminders");
  }, [searchParams, router]);

  function openNewReminderModal() {
    setEditingReminder(null);
    setCreateDefaults(undefined);
    setFormOpen(true);
  }

  function openEditReminderModal(reminder: Reminder) {
    setEditingReminder(reminder);
    setCreateDefaults(undefined);
    setFormOpen(true);
  }

  function handleFormSubmit(values: ReminderFormValues) {
    const links: Reminder["links"] = { ...(editingReminder?.links ?? {}) };
    if (values.linkProject.trim()) links.project = values.linkProject.trim();
    else delete links.project;
    if (values.linkNote.trim()) links.note = values.linkNote.trim();
    else delete links.note;
    if (values.linkNoteLabel.trim()) links.noteLabel = values.linkNoteLabel.trim();
    else delete links.noteLabel;
    if (values.linkEvent.trim()) links.event = values.linkEvent.trim();
    else delete links.event;

    const draft: ReminderDraft = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      date: values.date || undefined,
      time: values.date ? values.time || undefined : undefined,
      category: values.category,
      priority: values.priority,
      repeat: values.repeat,
      leadTime: values.leadTime,
      links: Object.keys(links).length > 0 ? links : undefined,
    };

    if (editingReminder) updateReminder(editingReminder.id, draft);
    else createReminder(draft);

    setFormOpen(false);
    setEditingReminder(null);
    setCreateDefaults(undefined);
  }

  function openEventCreator(defaults: ReminderEventDefaults, onCreated: (eventId: string) => void) {
    setEventCreator({ defaults, onCreated });
  }

  function openQuickEventCreator() {
    const targetReminder = nextReminder ?? reminders.find((reminder) => !reminder.completed) ?? null;

    openEventCreator(
      { title: targetReminder?.title ?? "", date: targetReminder?.date, time: targetReminder?.time },
      (eventId) => {
        if (!targetReminder) return;
        updateReminder(
          targetReminder.id,
          reminderToDraft(targetReminder, { ...targetReminder.links, event: eventId }),
        );
      },
    );
  }

  function toggleStatsFilter(filter: QuickFilterKey) {
    setActiveQuickFilter(activeQuickFilter === filter ? "all" : filter);
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-canvas">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              setStubDialog({
                title: "Скоро будет доступно",
                message: "Дополнительные настройки появятся позже.",
              })
            }
            searchInputRef={searchInputRef}
          />

          <RemindersStatsRow
            {...stats}
            activeFilter={activeQuickFilter}
            onToggleFilter={toggleStatsFilter}
          />

          <div className="grid flex-1 grid-cols-[1fr_300px] items-start gap-6">
            <div>
              {viewMode === "list" ? (
                <RemindersGroupedList
                  groups={groups}
                  now={now}
                  today={today}
                  collapsedKeys={collapsedGroups}
                  onToggleCollapse={toggleCollapsedGroup}
                  onToggleComplete={toggleComplete}
                  onToggleStar={toggleStar}
                  onSnooze={postponeReminder}
                  onEdit={openEditReminderModal}
                  onDelete={deleteReminder}
                />
              ) : (
                <RemindersScheduleView
                  reminders={visibleReminders}
                  now={now}
                  today={today}
                  onToggleComplete={toggleComplete}
                  onToggleStar={toggleStar}
                  onSnooze={postponeReminder}
                  onEdit={openEditReminderModal}
                  onDelete={deleteReminder}
                />
              )}
            </div>

            <RemindersInfoPanel
              reminders={reminders}
              now={now}
              today={today}
              nextReminder={nextReminder}
              selectedDateKey={selectedDateKey}
              onSelectDate={toggleSelectedDate}
              onToggleComplete={toggleComplete}
              onSnooze={postponeReminder}
              onOpenReminder={openEditReminderModal}
              onCreateEvent={openQuickEventCreator}
              onCreateReminder={openNewReminderModal}
              onOpenCalendar={() => router.push("/calendar")}
            />
          </div>
        </main>
      </div>

      <ReminderFormModal
        open={formOpen}
        initial={editingReminder}
        defaults={createDefaults}
        onClose={() => {
          setFormOpen(false);
          setEditingReminder(null);
          setCreateDefaults(undefined);
        }}
        onSubmit={handleFormSubmit}
      />

      <ReminderEventModal
        open={eventCreator !== null}
        defaults={eventCreator?.defaults ?? null}
        onClose={() => setEventCreator(null)}
        onCreated={(eventId) => {
          eventCreator?.onCreated(eventId);
          setEventCreator(null);
        }}
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

export default function RemindersPage() {
  return <Suspense fallback={null}><RemindersPageContent /></Suspense>;
}

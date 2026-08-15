"use client";

import { useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ArchiveHero } from "@/components/archive/ArchiveHero";
import { ArchiveCategories } from "@/components/archive/ArchiveCategories";
import { ArchiveFilters } from "@/components/archive/ArchiveFilters";
import { ArchiveTable } from "@/components/archive/ArchiveTable";
import { ArchiveInfoPanel } from "@/components/archive/ArchiveInfoPanel";
import { ArchiveBulkActionsBar } from "@/components/archive/ArchiveBulkActionsBar";
import { ArchiveConfirmModal } from "@/components/archive/ArchiveConfirmModal";
import { useClock } from "@/hooks/useClock";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useNotesStore } from "@/hooks/useNotesStore";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useRemindersStore } from "@/hooks/useRemindersStore";
import {
  ARCHIVE_CATEGORIES,
  estimateItemBytes,
  filterArchiveItems,
  formatByteSize,
  formatDeletedAtLabel,
  getCategorySummaries,
} from "@/lib/archive";
import { USER_NAME } from "@/lib/app-constants";
import type { Task } from "@/types/task";
import type { Note } from "@/types/note";
import type { Project, ProjectTask } from "@/types/project";
import type { CalendarEvent } from "@/types/calendar";
import type { Reminder } from "@/types/reminder";
import type { ArchiveDateFilterKey, ArchiveEntityType, ArchiveItem, ArchivePendingAction } from "@/types/archive";

export default function ArchivePage() {
  const { now } = useClock();

  const { items, removeItem, removeItems } = useArchiveStore();
  const { restoreDeletedTask } = useTasksStore();
  const { restoreDeletedNote } = useNotesStore();
  const { restoreDeletedProject, restoreArchivedTask } = useProjectsStore();
  const { restoreDeletedEvent } = useCalendarStore();
  const { restoreDeletedReminder } = useRemindersStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ArchiveEntityType | null>(null);
  const [dateFilter, setDateFilter] = useState<ArchiveDateFilterKey>("all");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<ArchivePendingAction | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categorySummaries = useMemo(() => getCategorySummaries(items), [items]);

  const filteredItems = useMemo(
    () => filterArchiveItems(items, { search: searchQuery, typeFilter, dateFilter }, now),
    [items, searchQuery, typeFilter, dateFilter, now],
  );

  const totalSizeLabel = useMemo(() => formatByteSize(items.reduce((sum, item) => sum + estimateItemBytes(item), 0)), [items]);
  const categoriesWithItems = useMemo(
    () => ARCHIVE_CATEGORIES.filter((category) => categorySummaries[category.key].count > 0).length,
    [categorySummaries],
  );
  const archivedThisMonth = useMemo(
    () =>
      items.filter((item) => {
        const deletedDate = new Date(item.deletedAt);
        return deletedDate.getFullYear() === now.getFullYear() && deletedDate.getMonth() === now.getMonth();
      }).length,
    [items, now],
  );
  const mostRecentLabel = useMemo(() => {
    if (items.length === 0) return "—";
    const latest = items.reduce((acc, item) => (item.deletedAt > acc.deletedAt ? item : acc), items[0]);
    return formatDeletedAtLabel(latest.deletedAt);
  }, [items]);

  function handleSelectType(type: ArchiveEntityType) {
    setTypeFilter((prev) => (prev === type ? null : type));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = filteredItems.length > 0 && filteredItems.every((item) => next.has(item.id));
      filteredItems.forEach((item) => {
        if (allSelected) next.delete(item.id);
        else next.add(item.id);
      });
      return next;
    });
  }

  // Restore pipeline (step 2/3 from the spec): hand originalData back to the
  // module it came from, then drop the ArchiveItem. Which store gets it is
  // the only entity-specific branching in the whole Archive module.
  function restoreOne(item: ArchiveItem) {
    switch (item.entityType) {
      case "projectTask": {
        const data = item.originalData as { projectId: string; projectTitle: string; task: ProjectTask };
        if (!restoreArchivedTask(data.projectId, data.task)) {
          window.alert(`Не удалось восстановить задачу: проект «${data.projectTitle}» больше не существует.`);
          return;
        }
        break;
      }
      case "task":
        restoreDeletedTask(item.originalData as Task);
        break;
      case "note":
        restoreDeletedNote(item.originalData as Note);
        break;
      case "project":
        restoreDeletedProject(item.originalData as Project);
        break;
      case "event":
        restoreDeletedEvent(item.originalData as CalendarEvent);
        break;
      case "reminder":
        restoreDeletedReminder(item.originalData as Reminder);
        break;
    }
    removeItem(item.id);
  }

  function handleRestoreOne(item: ArchiveItem) {
    restoreOne(item);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  }

  function handleRestoreSelected() {
    if (selectedIds.size === 0) return;
    for (const item of items) {
      if (selectedIds.has(item.id)) restoreOne(item);
    }
    setSelectedIds(new Set());
  }

  function handleExportSelected() {
    if (selectedIds.size === 0) return;
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    const blob = new Blob([JSON.stringify(selectedItems, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `planly-archive-export-${now.toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleConfirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.kind === "single") {
      removeItem(pendingAction.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(pendingAction.id);
        return next;
      });
    } else {
      removeItems(new Set(pendingAction.ids));
      setSelectedIds(new Set());
    }
    setPendingAction(null);
  }

  const pendingCopy = (() => {
    if (!pendingAction) return null;
    if (pendingAction.kind === "single") {
      return { title: "Удалить элемент навсегда?", message: `«${pendingAction.title}» будет удалён без возможности восстановления.` };
    }
    return {
      title: "Удалить выбранные элементы?",
      message: `Будет удалено элементов: ${pendingAction.ids.length}. Это действие нельзя отменить.`,
    };
  })();

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-canvas">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-screen flex-col lg:pl-64">
        <Header
          userName={USER_NAME}
          onMenuClick={() => setSidebarOpen(true)}
          title="Архив"
          enableTaskSearch={false}
          onSearchIconClick={() => searchInputRef.current?.focus()}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8">
          <ArchiveHero totalItems={items.length} categoriesWithItems={categoriesWithItems} archivedThisMonth={archivedThisMonth} />

          <ArchiveFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchInputRef={searchInputRef}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
          />

          <ArchiveCategories
            categories={ARCHIVE_CATEGORIES}
            summaries={categorySummaries}
            activeType={typeFilter}
            onSelectType={handleSelectType}
          />

          <ArchiveBulkActionsBar
            selectedCount={selectedIds.size}
            onRestoreSelected={handleRestoreSelected}
            onExportSelected={handleExportSelected}
            onDeleteSelected={() => setPendingAction({ kind: "selected", ids: Array.from(selectedIds) })}
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_280px]">
            <ArchiveTable
              items={filteredItems}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onRestore={handleRestoreOne}
              onDeleteRequest={(item) => setPendingAction({ kind: "single", id: item.id, title: item.title })}
            />

            <ArchiveInfoPanel totalItems={items.length} totalSizeLabel={totalSizeLabel} mostRecentLabel={mostRecentLabel} />
          </div>
        </main>
      </div>

      <ArchiveConfirmModal
        open={pendingAction !== null}
        title={pendingCopy?.title ?? ""}
        message={pendingCopy?.message ?? ""}
        confirmLabel="Удалить"
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmPendingAction}
      />
    </div>
  );
}

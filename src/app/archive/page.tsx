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
import { fromISODate } from "@/lib/date-utils";
import { ARCHIVE_CATEGORIES, ARCHIVE_STATS, createMockArchiveItems } from "@/lib/archive-mock-data";
import { filterArchiveItems, formatSizeLabel, getCategorySummaries, getUniqueProjects, getUniqueTags } from "@/lib/archive";
import { USER_NAME } from "@/lib/app-constants";
import type { ArchiveDateFilterKey, ArchiveItem, ArchiveItemType, ArchivePendingAction } from "@/types/archive";

export default function ArchivePage() {
  const { now, todayKey } = useClock();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<ArchiveItem[]>(() => createMockArchiveItems());

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ArchiveItemType | null>(null);
  const [dateFilter, setDateFilter] = useState<ArchiveDateFilterKey>("all");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingAction, setPendingAction] = useState<ArchivePendingAction | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const projects = useMemo(() => getUniqueProjects(items), [items]);
  const tags = useMemo(() => getUniqueTags(items), [items]);
  const categorySummaries = useMemo(() => getCategorySummaries(items), [items]);

  const filteredItems = useMemo(
    () => filterArchiveItems(items, { search: searchQuery, typeFilter, dateFilter, projectFilter, tagFilter }, now),
    [items, searchQuery, typeFilter, dateFilter, projectFilter, tagFilter, now],
  );

  const totalSizeLabel = useMemo(() => formatSizeLabel(items.reduce((sum, item) => sum + item.sizeKb, 0)), [items]);
  const categoriesWithItems = useMemo(
    () => ARCHIVE_CATEGORIES.filter((category) => categorySummaries[category.key].count > 0).length,
    [categorySummaries],
  );
  const archivedThisMonth = useMemo(
    () =>
      items.filter((item) => {
        const archivedDate = fromISODate(item.archivedAtKey);
        return archivedDate.getFullYear() === now.getFullYear() && archivedDate.getMonth() === now.getMonth();
      }).length,
    [items, now],
  );

  function handleSelectType(type: ArchiveItemType) {
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

  function removeItems(ids: Set<string>) {
    setItems((prev) => prev.filter((item) => !ids.has(item.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function handleRestoreOne(item: ArchiveItem) {
    removeItems(new Set([item.id]));
  }

  function handleRestoreSelected() {
    if (selectedIds.size === 0) return;
    removeItems(new Set(selectedIds));
  }

  function handleExportSelected() {
    if (selectedIds.size === 0) return;
    const selectedItems = items.filter((item) => selectedIds.has(item.id));
    const blob = new Blob([JSON.stringify(selectedItems, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `planly-archive-export-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleConfirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction.kind === "single") {
      removeItems(new Set([pendingAction.id]));
    } else if (pendingAction.kind === "selected") {
      removeItems(new Set(pendingAction.ids));
    } else {
      setItems([]);
      setSelectedIds(new Set());
    }
    setPendingAction(null);
  }

  const pendingCopy = (() => {
    if (!pendingAction) return null;
    if (pendingAction.kind === "single") {
      return { title: "Удалить элемент?", message: `«${pendingAction.name}» будет удалён без возможности восстановления.` };
    }
    if (pendingAction.kind === "selected") {
      return {
        title: "Удалить выбранные элементы?",
        message: `Будет удалено элементов: ${pendingAction.ids.length}. Это действие нельзя отменить.`,
      };
    }
    return {
      title: "Очистить архив?",
      message: `Все элементы архива (${items.length}) будут удалены без возможности восстановления. Это действие нельзя отменить.`,
    };
  })();

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-gray-950">
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
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
            projects={projects}
            tags={tags}
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
            onClearArchive={() => setPendingAction({ kind: "all" })}
          />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_280px]">
            <ArchiveTable
              items={filteredItems}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onRestore={handleRestoreOne}
              onDeleteRequest={(item) => setPendingAction({ kind: "single", id: item.id, name: item.name })}
            />

            <ArchiveInfoPanel
              totalItems={items.length}
              totalSizeLabel={totalSizeLabel}
              lastCleanupLabel={ARCHIVE_STATS.lastCleanupLabel}
              freeSpaceLabel={ARCHIVE_STATS.freeSpaceLabel}
              freeSpaceUsedPercent={ARCHIVE_STATS.freeSpaceUsedPercent}
            />
          </div>
        </main>
      </div>

      <ArchiveConfirmModal
        open={pendingAction !== null}
        title={pendingCopy?.title ?? ""}
        message={pendingCopy?.message ?? ""}
        confirmLabel={pendingAction?.kind === "all" ? "Очистить архив" : "Удалить"}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmPendingAction}
      />
    </div>
  );
}

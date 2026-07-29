"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { NotesToolbar, type NotesViewMode } from "@/components/notes/NotesToolbar";
import { NotesListPanel } from "@/components/notes/NotesListPanel";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NotesInfoPanel } from "@/components/notes/NotesInfoPanel";
import { useNotesStore } from "@/hooks/useNotesStore";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { useRemindersStore } from "@/hooks/useRemindersStore";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import { useClock } from "@/hooks/useClock";
import {
  matchesFolder,
  matchesQuickFilter,
  matchesSearch,
  resolveRelationLabels,
  sortNotes,
  type NoteFilterKey,
  type NoteSortKey,
} from "@/lib/notes";
import { USER_NAME } from "@/lib/app-constants";
import type { NoteFolderKey } from "@/types/note";

const FILTER_LABEL_TO_KEY: Record<string, NoteFilterKey> = {
  Все: "all",
  "С вложениями": "withAttachments",
  "С задачами": "withRelations",
  "Без тегов": "withoutTags",
};

const SORT_LABEL_TO_KEY: Record<string, NoteSortKey> = {
  "По дате изменения": "modified",
  "По названию": "title",
  "По дате создания": "created",
  "По избранному": "favorite",
};

function NotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { now } = useClock();

  const {
    hydrated,
    notes,
    tagDefs,
    createNote,
    updateNote,
    deleteNote,
    duplicateNote,
    toggleStar,
    togglePin,
    toggleArchive,
    tagColorFor,
    addTagToNote,
    removeTagFromNote,
    recolorTagDef,
    addAttachment,
    removeAttachment,
    setLink,
  } = useNotesStore();
  const { tasks, addTaskFromText } = useTasksStore();
  const { events } = useCalendarStore();
  const { projects } = useProjectsStore();
  const { reminders } = useRemindersStore();
  const { items: archiveItems, hydrated: archiveHydrated } = useArchiveStore();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<NoteFolderKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabel, setFilterLabel] = useState("Все");
  const [sortLabel, setSortLabel] = useState("По дате изменения");
  const [viewMode, setViewMode] = useState<NotesViewMode>("list");
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const appliedDeepLink = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (activeNoteId && notes.some((note) => note.id === activeNoteId)) return;
    setActiveNoteId(notes[0]?.id ?? null);
  }, [notes, activeNoteId, hydrated]);

  useEffect(() => {
    if (!hydrated || !archiveHydrated) return;
    const archivedIds = new Set(archiveItems.filter((item) => item.entityType === "reminder").map((item) => item.entityId));
    for (const note of notes) {
      const id = note.links.reminderId;
      if (id && !reminders.some((reminder) => reminder.id === id) && !archivedIds.has(id)) {
        setLink(note.id, "reminderId", undefined);
      }
    }
  }, [notes, reminders, archiveItems, hydrated, archiveHydrated, setLink]);

  // "Скопировать ссылку" deep link: /notes?note=<id> opens that note once.
  useEffect(() => {
    if (appliedDeepLink.current) return;
    const noteId = searchParams.get("note");
    if (!noteId) return;
    if (notes.some((note) => note.id === noteId)) {
      appliedDeepLink.current = true;
      setActiveNoteId(noteId);
      setActiveFolder("all");
      setSearchQuery("");
    } else if (hydrated) {
      appliedDeepLink.current = true;
      router.replace("/notes");
    }
  }, [notes, searchParams, hydrated, router]);

  const relationLabelsByNoteId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof resolveRelationLabels>>();
    for (const note of notes) map.set(note.id, resolveRelationLabels(note, projects, tasks, events));
    return map;
  }, [notes, projects, tasks, events]);

  const visibleNotes = useMemo(() => {
    let list = notes.filter((note) => matchesFolder(note, activeFolder));
    list = list.filter((note) => matchesQuickFilter(note, FILTER_LABEL_TO_KEY[filterLabel] ?? "all"));

    const query = searchQuery.trim();
    if (query) {
      list = list.filter((note) => matchesSearch(note, query, relationLabelsByNoteId.get(note.id)!));
    }
    return sortNotes(list, SORT_LABEL_TO_KEY[sortLabel] ?? "modified");
  }, [notes, activeFolder, filterLabel, searchQuery, sortLabel, relationLabelsByNoteId]);

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;
  function selectFirstAvailable(excludeId: string) {
    const next = notes.find((note) => note.id !== excludeId && matchesFolder(note, activeFolder));
    setActiveNoteId(next?.id ?? null);
  }

  function handleNewNote() {
    const id = createNote();
    setActiveNoteId(id);
    setActiveFolder("all");
    setSearchQuery("");
  }

  function handleDelete(id: string) {
    deleteNote(id);
    if (activeNoteId === id) selectFirstAvailable(id);
  }

  function handleDuplicate(id: string) {
    const newId = duplicateNote(id);
    setActiveNoteId(newId);
  }

  function handleCreateTaskFromNote(note: { id: string; title: string }) {
    const taskId = addTaskFromText(note.title);
    if (taskId) setLink(note.id, "taskId", taskId);
  }

  async function handleCopyLink(note: { id: string }) {
    const url = `${window.location.origin}/notes?note=${note.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setStubDialog({ title: "Ссылка скопирована", message: url });
    } catch {
      setStubDialog({ title: "Не удалось скопировать", message: url });
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-gray-950">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-screen flex-col lg:pl-64">
        <Header
          userName={USER_NAME}
          onMenuClick={() => setSidebarOpen(true)}
          title="Заметки"
          enableTaskSearch={false}
          onSearchIconClick={() => searchInputRef.current?.focus()}
        />

        <main className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-6 lg:px-8">
          <div className="shrink-0 pb-4">
            <NotesToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterLabel={filterLabel}
              onFilterLabelChange={setFilterLabel}
              sortLabel={sortLabel}
              onSortLabelChange={setSortLabel}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onNewNote={handleNewNote}
              searchInputRef={searchInputRef}
            />
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pb-4 md:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 min-[1320px]:grid-cols-[300px_minmax(0,1fr)_280px]">
            <NotesListPanel
              notes={visibleNotes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onToggleStar={toggleStar}
              onTogglePin={togglePin}
              activeFolder={activeFolder}
              onFolderChange={setActiveFolder}
              viewMode={viewMode}
              searchQuery={searchQuery}
              isLoading={!hydrated}
              now={now}
              tagColorFor={tagColorFor}
              onCreate={handleNewNote}
              isFiltered={Boolean(searchQuery || filterLabel !== "Все" || activeFolder !== "all")}
            />

            <NoteEditor
              note={activeNote}
              now={now}
              tagDefs={tagDefs}
              tagColorFor={tagColorFor}
              onUpdateNote={updateNote}
              onToggleStar={toggleStar}
              onTogglePin={togglePin}
              onToggleArchive={toggleArchive}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onAddTag={addTagToNote}
              onRemoveTag={removeTagFromNote}
              onRecolorTag={recolorTagDef}
            />

            <div className="hidden min-h-0 min-[1320px]:block">
              <NotesInfoPanel
                note={activeNote}
                tagDefs={tagDefs}
                tagColorFor={tagColorFor}
                projects={projects}
                tasks={tasks}
                events={events}
                reminders={reminders}
                archiveItems={archiveItems}
                onAddTag={addTagToNote}
                onRemoveTag={removeTagFromNote}
                onRecolorTag={recolorTagDef}
                onAddAttachment={addAttachment}
                onRemoveAttachment={removeAttachment}
                onSetLink={setLink}
                onCreateTaskFromNote={handleCreateTaskFromNote}
                onCopyLink={handleCopyLink}
                onOpenReminders={() => {
                  if (!activeNote) return;
                  const query = new URLSearchParams({
                    create: "1",
                    relationType: "note",
                    relationId: activeNote.id,
                    relationLabel: activeNote.title,
                    title: activeNote.title,
                  });
                  router.push(`/reminders?${query.toString()}`);
                }}
              />
            </div>
          </div>
        </main>
      </div>

      <ComingSoonDialog
        open={stubDialog !== null}
        onClose={() => setStubDialog(null)}
        title={stubDialog?.title ?? ""}
        message={stubDialog?.message}
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesPageContent />
    </Suspense>
  );
}

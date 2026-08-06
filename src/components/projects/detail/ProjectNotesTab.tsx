"use client";

import { useMemo, useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { NotesToolbar, type NotesViewMode } from "@/components/notes/NotesToolbar";
import { NotesListPanel } from "@/components/notes/NotesListPanel";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useNotesStore } from "@/hooks/useNotesStore";
import { useClock } from "@/hooks/useClock";
import {
  matchesFolder,
  matchesQuickFilter,
  matchesSearch,
  sortNotes,
  type NoteFilterKey,
  type NoteSortKey,
} from "@/lib/notes";
import type { Project } from "@/types/project";
import type { NoteFolderKey } from "@/types/note";

// Reuses the exact same Notes UI (toolbar/list/editor) and the same
// useNotesStore instance as /notes — no separate note data or editor here.
// "Attached" just means note.links.projectId === project.id; detaching only
// clears that link, it never deletes the note itself.

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

// Relation labels (project/task/event names) are skipped for search matching
// in this embedded view — title/content/tags/attachments still match.
const NO_RELATIONS = { projectName: null, taskTitle: null, eventTitle: null };

interface ProjectNotesTabProps {
  project: Project;
  editable: boolean;
}

export function ProjectNotesTab({ project, editable }: ProjectNotesTabProps) {
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
    setLink,
  } = useNotesStore();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<NoteFolderKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabel, setFilterLabel] = useState("Все");
  const [sortLabel, setSortLabel] = useState("По дате изменения");
  const [viewMode, setViewMode] = useState<NotesViewMode>("list");

  const linkedNotes = useMemo(() => notes.filter((note) => note.links.projectId === project.id), [notes, project.id]);
  const unlinkedNotes = useMemo(
    () => notes.filter((note) => note.links.projectId !== project.id && !note.archived),
    [notes, project.id],
  );

  const visibleNotes = useMemo(() => {
    let list = linkedNotes.filter((note) => matchesFolder(note, activeFolder));
    list = list.filter((note) => matchesQuickFilter(note, FILTER_LABEL_TO_KEY[filterLabel] ?? "all"));
    const query = searchQuery.trim();
    if (query) list = list.filter((note) => matchesSearch(note, query, NO_RELATIONS));
    return sortNotes(list, SORT_LABEL_TO_KEY[sortLabel] ?? "modified");
  }, [linkedNotes, activeFolder, filterLabel, searchQuery, sortLabel]);

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;
  const activeNoteIsLinked = activeNote?.links.projectId === project.id;

  function handleNewNote() {
    if (!editable) return;
    const id = createNote();
    setLink(id, "projectId", project.id);
    setActiveNoteId(id);
    setActiveFolder("all");
    setSearchQuery("");
  }

  function handleAttach(noteId: string) {
    setLink(noteId, "projectId", project.id);
    setActiveNoteId(noteId);
  }

  function handleDetach(noteId: string) {
    setLink(noteId, "projectId", undefined);
    if (activeNoteId === noteId) setActiveNoteId(null);
  }

  function handleDelete(id: string) {
    deleteNote(id);
    if (activeNoteId === id) setActiveNoteId(null);
  }

  function handleDuplicate(id: string) {
    setActiveNoteId(duplicateNote(id));
  }

  return (
    <div className="flex h-[calc(100vh-260px)] min-h-[540px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        />
        {editable && unlinkedNotes.length > 0 && (
          <DropdownMenu
            trigger={
              <>
                <Link2 size={14} />
                Прикрепить заметку
              </>
            }
            triggerClassName="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
            align="right"
            items={unlinkedNotes.map((note) => ({
              key: note.id,
              label: note.title || "Без названия",
              onSelect: () => handleAttach(note.id),
            }))}
          />
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
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
        />

        <div className="flex min-h-0 flex-col gap-2">
          {activeNote && activeNoteIsLinked && (
            <div className="flex shrink-0 items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-white/8 dark:bg-surface dark:text-ink-faint">
              <span>Прикреплена к проекту «{project.name}»</span>
              {editable && (
                <button
                  type="button"
                  onClick={() => handleDetach(activeNote.id)}
                  className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-red-500 dark:text-ink-dim"
                >
                  <Unlink size={12} />
                  Открепить
                </button>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1">
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
          </div>
        </div>
      </div>
    </div>
  );
}

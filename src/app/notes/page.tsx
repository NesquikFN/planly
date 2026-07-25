"use client";

import { useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ComingSoonDialog } from "@/components/ui/ComingSoonDialog";
import { NotesToolbar, type NotesViewMode } from "@/components/notes/NotesToolbar";
import { NotesListPanel } from "@/components/notes/NotesListPanel";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NotesInfoPanel } from "@/components/notes/NotesInfoPanel";
import { mockNotes } from "@/lib/notes-mock-data";
import { USER_NAME } from "@/lib/app-constants";
import type { Note, NoteFolderKey } from "@/types/note";

function matchesFolder(note: Note, folder: NoteFolderKey): boolean {
  switch (folder) {
    case "all":
      return !note.trashed && !note.archived;
    case "favorites":
      return note.starred && !note.trashed;
    case "recent":
      return !note.trashed && !note.archived;
    case "drafts":
      return note.draft && !note.trashed;
    case "archived":
      return note.archived;
    case "trash":
      return note.trashed;
    default:
      return true;
  }
}

export default function NotesPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(mockNotes[0]?.id ?? null);
  const [activeFolder, setActiveFolder] = useState<NoteFolderKey>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabel, setFilterLabel] = useState("Все");
  const [sortLabel, setSortLabel] = useState("По дате изменения");
  const [viewMode, setViewMode] = useState<NotesViewMode>("list");
  const [stubDialog, setStubDialog] = useState<{ title: string; message?: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const visibleNotes = useMemo(() => {
    let list = notes.filter((note) => matchesFolder(note, activeFolder));
    if (activeTag) list = list.filter((note) => note.tags.includes(activeTag));

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.description.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
    return list;
  }, [notes, activeFolder, activeTag, searchQuery]);

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;

  function toggleStar(id: string) {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, starred: !note.starred } : note)));
  }

  function toggleSectionItem(noteId: string, sectionId: string, itemId: string) {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId || !note.sections) return note;
        return {
          ...note,
          sections: note.sections.map((section) =>
            section.id !== sectionId || !section.checklist
              ? section
              : {
                  ...section,
                  checklist: section.checklist.map((item) =>
                    item.id === itemId ? { ...item, done: !item.done } : item,
                  ),
                },
          ),
        };
      }),
    );
  }

  function toggleBottomItem(noteId: string, itemId: string) {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId || !note.bottomChecklist) return note;
        return {
          ...note,
          bottomChecklist: note.bottomChecklist.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item,
          ),
        };
      }),
    );
  }

  function handleNewNote() {
    const id = `n-${Date.now()}`;
    const newNote: Note = {
      id,
      title: "Новая заметка",
      description: "Начните печатать, чтобы добавить содержимое…",
      icon: FileText,
      color: "blue",
      tags: [],
      dateLabel: "Сейчас",
      starred: false,
      draft: true,
      archived: false,
      trashed: false,
      lastEditedLabel: "Сейчас",
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(id);
    setActiveFolder("all");
    setActiveTag(null);
    setSearchQuery("");
  }

  function handleStubAction(action: string, note: Note) {
    setStubDialog({ title: "Скоро будет доступно", message: `«${action}» для заметки «${note.title}» появится позже.` });
  }

  function handleAddTag(note: Note) {
    setStubDialog({
      title: "Скоро будет доступно",
      message: `Добавление тегов для «${note.title}» появится в одном из следующих обновлений.`,
    });
  }

  function handleMoreTags() {
    setStubDialog({ title: "Скоро будет доступно", message: "Полный список тегов появится в одном из следующих обновлений." });
  }

  function handleQuickAction(action: string, note: Note) {
    setStubDialog({ title: "Скоро будет доступно", message: `«${action}» для заметки «${note.title}» появится позже.` });
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-gray-950">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notesExtras={{
          activeFolder,
          onFolderChange: setActiveFolder,
          activeTag,
          onTagChange: setActiveTag,
          onMoreTags: handleMoreTags,
        }}
      />

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

          <div className="grid min-h-0 flex-1 grid-cols-[350px_1fr_300px] gap-6 pb-4">
            <NotesListPanel
              notes={visibleNotes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onToggleStar={toggleStar}
              activeFolder={activeFolder}
              onFolderChange={setActiveFolder}
              viewMode={viewMode}
            />

            <NoteEditor
              note={activeNote}
              onToggleStar={toggleStar}
              onStubAction={handleStubAction}
              onAddTag={handleAddTag}
              onToggleSectionItem={toggleSectionItem}
              onToggleBottomItem={toggleBottomItem}
            />

            <NotesInfoPanel note={activeNote} onAddTag={handleAddTag} onQuickAction={handleQuickAction} />
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

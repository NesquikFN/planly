"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { DEFAULT_TAG_DEFS, extractPlainText, generateNoteId, nextTagColor, noteExcerpt } from "@/lib/notes";
import { recordDailyActivity } from "@/lib/streak";
import type { CalendarColor } from "@/types/calendar";
import type { Note, NoteAttachment, NoteIconKey, NoteLinks, NoteTagDef } from "@/types/note";

// Context/Provider for the Notes domain — mirrors useTasksStore/useCalendarStore
// (localStorage-backed, hydrate-after-mount to dodge SSR/client mismatches),
// mounted at the root layout so the unified Archive pipeline can reach it
// from any route (deleteNote hands the note to ArchiveStore and removes it
// from here entirely — there is no separate local trash).

const NOTES_STORAGE_KEY = "planly:notes";
const NOTE_TAGS_STORAGE_KEY = "planly:note-tags";

interface NotesStoreValue {
  hydrated: boolean;
  notes: Note[];
  tagDefs: NoteTagDef[];

  createNote: () => string;
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "contentHtml" | "color" | "iconKey">>) => void;
  deleteNote: (id: string) => void;
  /** Reinserts a full note snapshot — used only by the Archive restore pipeline. */
  restoreDeletedNote: (note: Note) => void;
  duplicateNote: (id: string) => string;
  toggleStar: (id: string) => void;
  togglePin: (id: string) => void;
  toggleArchive: (id: string) => void;

  tagColorFor: (label: string) => CalendarColor;
  addTagToNote: (noteId: string, label: string) => void;
  removeTagFromNote: (noteId: string, label: string) => void;
  createTagDef: (label: string) => void;
  renameTagDef: (oldLabel: string, newLabel: string) => void;
  deleteTagDef: (label: string) => void;
  recolorTagDef: (label: string, color: CalendarColor) => void;

  addAttachment: (noteId: string, attachment: NoteAttachment) => void;
  removeAttachment: (noteId: string, attachmentId: string) => void;

  setLink: (noteId: string, key: keyof NoteLinks, value: string | undefined) => void;
}

const NotesContext = createContext<NotesStoreValue | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasksStore();
  const { events } = useCalendarStore();
  const archiveStore = useArchiveStore();
  const { projects } = useProjectsStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [tagDefs, setTagDefs] = useState<NoteTagDef[]>(DEFAULT_TAG_DEFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedNotes = readStorage<Note[] | null>(NOTES_STORAGE_KEY, null);
    if (storedNotes !== null) setNotes(storedNotes);

    const storedTags = readStorage<NoteTagDef[] | null>(NOTE_TAGS_STORAGE_KEY, null);
    if (storedTags !== null) setTagDefs(storedTags);

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(NOTES_STORAGE_KEY, notes);
  }, [notes, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(NOTE_TAGS_STORAGE_KEY, tagDefs);
  }, [tagDefs, hydrated]);

  // Keep an archived relation by ID while its source snapshot is in the
  // global Archive. Clear it only after permanent deletion.
  useEffect(() => {
    if (!hydrated || !archiveStore.hydrated) return;
    const archivedIds = new Set(archiveStore.items.map((item) => `${item.entityType}:${item.entityId}`));
    setNotes((prev) => {
      let changed = false;
      const next = prev.map((note) => {
        const taskGone = note.links.taskId && !tasks.some((t) => t.id === note.links.taskId) && !archivedIds.has(`task:${note.links.taskId}`);
        const eventGone = note.links.eventId && !events.some((e) => e.id === note.links.eventId) && !archivedIds.has(`event:${note.links.eventId}`);
        const projectGone = note.links.projectId && !projects.some((p) => p.id === note.links.projectId) && !archivedIds.has(`project:${note.links.projectId}`);
        if (!taskGone && !eventGone && !projectGone) return note;
        changed = true;
        const links = { ...note.links };
        if (taskGone) delete links.taskId;
        if (eventGone) delete links.eventId;
        if (projectGone) delete links.projectId;
        return { ...note, links };
      });
      return changed ? next : prev;
    });
  }, [tasks, events, projects, archiveStore.items, archiveStore.hydrated, hydrated]);

  const touch = () => new Date().toISOString();

  const createNote = useCallback((): string => {
    const id = generateNoteId("n");
    const now = touch();
    const newNote: Note = {
      id,
      title: "Новая заметка",
      contentHtml: "",
      iconKey: "file-text",
      color: "blue",
      tags: [],
      starred: false,
      pinned: false,
      draft: true,
      archived: false,
      createdAt: now,
      updatedAt: now,
      attachments: [],
      links: {},
    };
    setNotes((prev) => [newNote, ...prev]);
    recordDailyActivity();
    return id;
  }, []);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "contentHtml" | "color" | "iconKey">>) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) return note;
          const hasRealContent =
            (patch.contentHtml !== undefined && extractPlainText(patch.contentHtml).length > 0) ||
            (patch.title !== undefined && patch.title.trim().length > 0 && patch.title.trim() !== "Новая заметка");
          return {
            ...note,
            ...patch,
            draft: note.draft && !hasRealContent,
            updatedAt: touch(),
          };
        }),
      );
    },
    [],
  );

  const deleteNote = useCallback(
    (id: string) => {
      const note = notes.find((item) => item.id === id);
      if (note) {
        archiveStore.addItem({
          entityType: "note",
          entityId: note.id,
          title: note.title,
          preview: noteExcerpt(note, 80),
          sourceModule: "Заметки",
          icon: note.iconKey,
          color: note.color,
          originalData: note,
        });
      }
      setNotes((prev) => prev.filter((item) => item.id !== id));
    },
    [notes, archiveStore],
  );

  /** Reinserts a full note snapshot — used only by the Archive restore pipeline. */
  const restoreDeletedNote = useCallback((note: Note) => {
    setNotes((prev) => [note, ...prev]);
  }, []);

  const duplicateNote = useCallback((id: string): string => {
    const newId = generateNoteId("n");
    setNotes((prev) => {
      const source = prev.find((note) => note.id === id);
      if (!source) return prev;
      const now = touch();
      const clone: Note = {
        ...source,
        id: newId,
        title: `${source.title} (копия)`,
        starred: false,
        pinned: false,
        createdAt: now,
        updatedAt: now,
        attachments: source.attachments.map((file) => ({ ...file, id: generateNoteId("att") })),
      };
      const sourceIndex = prev.findIndex((note) => note.id === id);
      const next = [...prev];
      next.splice(sourceIndex + 1, 0, clone);
      return next;
    });
    return newId;
  }, []);

  const toggleStar = useCallback((id: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, starred: !note.starred } : note)));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)));
  }, []);

  const toggleArchive = useCallback((id: string) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, archived: !note.archived } : note)));
  }, []);

  const tagColorFor = useCallback(
    (label: string): CalendarColor => tagDefs.find((tag) => tag.label === label)?.color ?? nextTagColor(tagDefs.length),
    [tagDefs],
  );

  const createTagDef = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setTagDefs((prev) => (prev.some((tag) => tag.label === trimmed) ? prev : [...prev, { label: trimmed, color: nextTagColor(prev.length) }]));
  }, []);

  const addTagToNote = useCallback((noteId: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setTagDefs((prev) => (prev.some((tag) => tag.label === trimmed) ? prev : [...prev, { label: trimmed, color: nextTagColor(prev.length) }]));
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId && !note.tags.includes(trimmed)
          ? { ...note, tags: [...note.tags, trimmed], updatedAt: touch() }
          : note,
      ),
    );
  }, []);

  const removeTagFromNote = useCallback((noteId: string, label: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, tags: note.tags.filter((tag) => tag !== label), updatedAt: touch() } : note)),
    );
  }, []);

  const renameTagDef = useCallback((oldLabel: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed || trimmed === oldLabel) return;
    setTagDefs((prev) => {
      if (prev.some((tag) => tag.label === trimmed)) return prev.filter((tag) => tag.label !== oldLabel);
      return prev.map((tag) => (tag.label === oldLabel ? { ...tag, label: trimmed } : tag));
    });
    setNotes((prev) =>
      prev.map((note) =>
        note.tags.includes(oldLabel)
          ? { ...note, tags: Array.from(new Set(note.tags.map((tag) => (tag === oldLabel ? trimmed : tag)))) }
          : note,
      ),
    );
  }, []);

  const deleteTagDef = useCallback((label: string) => {
    setTagDefs((prev) => prev.filter((tag) => tag.label !== label));
    setNotes((prev) =>
      prev.map((note) => (note.tags.includes(label) ? { ...note, tags: note.tags.filter((tag) => tag !== label) } : note)),
    );
  }, []);

  const recolorTagDef = useCallback((label: string, color: CalendarColor) => {
    setTagDefs((prev) => prev.map((tag) => (tag.label === label ? { ...tag, color } : tag)));
  }, []);

  const addAttachment = useCallback((noteId: string, attachment: NoteAttachment) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, attachments: [...note.attachments, attachment], updatedAt: touch() } : note)),
    );
  }, []);

  const removeAttachment = useCallback((noteId: string, attachmentId: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? { ...note, attachments: note.attachments.filter((file) => file.id !== attachmentId), updatedAt: touch() }
          : note,
      ),
    );
  }, []);

  const setLink = useCallback((noteId: string, key: keyof NoteLinks, value: string | undefined) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        const links = { ...note.links };
        if (value) links[key] = value;
        else delete links[key];
        return { ...note, links, updatedAt: touch() };
      }),
    );
  }, []);

  const value = useMemo<NotesStoreValue>(
    () => ({
      hydrated,
      notes,
      tagDefs,
      createNote,
      updateNote,
      deleteNote,
      restoreDeletedNote,
      duplicateNote,
      toggleStar,
      togglePin,
      toggleArchive,
      tagColorFor,
      addTagToNote,
      removeTagFromNote,
      createTagDef,
      renameTagDef,
      deleteTagDef,
      recolorTagDef,
      addAttachment,
      removeAttachment,
      setLink,
    }),
    [
      hydrated,
      notes,
      tagDefs,
      createNote,
      updateNote,
      deleteNote,
      restoreDeletedNote,
      duplicateNote,
      toggleStar,
      togglePin,
      toggleArchive,
      tagColorFor,
      addTagToNote,
      removeTagFromNote,
      createTagDef,
      renameTagDef,
      deleteTagDef,
      recolorTagDef,
      addAttachment,
      removeAttachment,
      setLink,
    ],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotesStore(): NotesStoreValue {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotesStore must be used within a NotesProvider");
  return ctx;
}

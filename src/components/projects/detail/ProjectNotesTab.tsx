"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useNotesStore } from "@/hooks/useNotesStore";
import { useProjectsStore } from "@/hooks/useProjectsStore";
import { extractPlainText } from "@/lib/notes";
import type { Project } from "@/types/project";

export function ProjectNotesTab({ project }: { project: Project }) {
  const { notes, createNote, updateNote, deleteNote, setLink } = useNotesStore();
  const { canEdit, logActivity } = useProjectsStore();
  const editable = canEdit(project);
  const linked = notes.filter((n) => n.links.projectId === project.id && !n.archived);
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function open(noteId: string) {
    const note = notes.find((n) => n.id === noteId); if (!note) return;
    setOpenId(note.id); setTitle(note.title); setContent(note.contentHtml);
  }
  function add() {
    if (!editable) return;
    const id = createNote(); setLink(id, "projectId", project.id); setOpenId(id); setTitle("Новая заметка"); setContent("");
    logActivity(project.id, { actionType: "noteCreated", message: "создал(а) заметку", entityType: "note", entityId: id });
  }
  function save() {
    if (!openId || !editable) return;
    updateNote(openId, { title: title.trim() || "Без названия", contentHtml: content });
    logActivity(project.id, { actionType: "noteEdited", message: `изменил(а) заметку «${title.trim() || "Без названия"}»`, entityType: "note", entityId: openId });
  }
  function remove(id: string) {
    if (!editable) return; const note = notes.find((n) => n.id === id);
    deleteNote(id); if (openId === id) setOpenId(null);
    logActivity(project.id, { actionType: "noteDeleted", message: `удалил(а) заметку «${note?.title ?? ""}»`, entityType: "note", entityId: id });
  }

  return <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
    <section className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <button type="button" disabled={!editable} onClick={add} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"><Plus size={15}/>Новая заметка</button>
      <ul className="mt-3 space-y-2">{linked.map((note) => <li key={note.id} className="flex items-center gap-2">
        <button type="button" onClick={() => open(note.id)} className="min-w-0 flex-1 rounded-lg p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{note.title}</p>
          <p className="truncate text-xs text-gray-400">{extractPlainText(note.contentHtml) || "Пустая заметка"}</p>
        </button>
        {editable && <button type="button" onClick={() => remove(note.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>}
      </li>)}</ul>
    </section>
    <section className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      {openId ? <div className="space-y-3">
        <input disabled={!editable} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border-b border-gray-200 bg-transparent pb-2 text-lg font-semibold outline-none dark:border-gray-700"/>
        <textarea disabled={!editable} value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="w-full resize-none rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none dark:border-gray-700"/>
        {editable && <button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Save size={14}/>Сохранить</button>}
      </div> : <p className="py-16 text-center text-sm text-gray-400">Выберите или создайте заметку</p>}
    </section>
  </div>;
}

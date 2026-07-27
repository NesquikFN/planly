"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, MoreVertical, Plus, Star, Pin } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { NoteEditorToolbar, type NoteBlockTag } from "@/components/notes/NoteEditorToolbar";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { countWords, escapeHtml, extractPlainText, formatNoteDateLabel, formatReadingTime } from "@/lib/notes";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { Note, NoteTagDef } from "@/types/note";

interface NoteEditorProps {
  note: Note | null;
  now: Date;
  tagDefs: NoteTagDef[];
  tagColorFor: (label: string) => CalendarColor;
  onUpdateNote: (id: string, patch: Partial<Pick<Note, "title" | "contentHtml" | "color" | "iconKey">>) => void;
  onToggleStar: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, label: string) => void;
  onRemoveTag: (id: string, label: string) => void;
  onRecolorTag: (label: string, color: CalendarColor) => void;
}

const TABLE_HTML =
  "<table><tbody>" +
  "<tr><th>Заголовок 1</th><th>Заголовок 2</th><th>Заголовок 3</th></tr>" +
  "<tr><td><br></td><td><br></td><td><br></td></tr>" +
  "<tr><td><br></td><td><br></td><td><br></td></tr>" +
  "</tbody></table><p><br></p>";

export function NoteEditor({
  note,
  now,
  tagDefs,
  tagColorFor,
  onUpdateNote,
  onToggleStar,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onAddTag,
  onRemoveTag,
  onRecolorTag,
}: NoteEditorProps) {
  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-center dark:border-gray-800 dark:bg-gray-900">
        <FileText size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Заметка не выбрана</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Выберите заметку из списка слева</p>
      </div>
    );
  }

  return (
    <NoteEditorBody
      key={note.id}
      note={note}
      now={now}
      tagDefs={tagDefs}
      tagColorFor={tagColorFor}
      onUpdateNote={onUpdateNote}
      onToggleStar={onToggleStar}
      onTogglePin={onTogglePin}
      onToggleArchive={onToggleArchive}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
      onRecolorTag={onRecolorTag}
    />
  );
}

/** Keyed by note.id from the parent — remounts fresh per note switch, so each
 * note gets its own contentEditable ref/timers/local state with no stale
 * closures, and flushes any pending debounced save on unmount (switch-away). */
function NoteEditorBody({
  note,
  now,
  tagDefs,
  tagColorFor,
  onUpdateNote,
  onToggleStar,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onAddTag,
  onRemoveTag,
  onRecolorTag,
}: NoteEditorProps & { note: Note }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [titleDraft, setTitleDraft] = useState(note.title);
  const [saveStatus, setSaveStatus] = useState<"saved" | "pending" | "flash">("saved");
  const [pressed, setPressed] = useState({ bold: false, italic: false, underline: false, strike: false });
  const [activeBlock, setActiveBlock] = useState<NoteBlockTag>("P");
  const [wordStats, setWordStats] = useState(() => {
    const words = countWords(extractPlainText(note.contentHtml));
    return { words, chars: extractPlainText(note.contentHtml).length };
  });
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  // Body content is set once on mount from the note's stored HTML — never
  // re-synced on every keystroke, so the caret position is never fought.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.innerHTML = note.contentHtml;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        if (bodyRef.current) onUpdateNote(note.id, { contentHtml: bodyRef.current.innerHTML });
      }
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleSelectionChange() {
      if (!bodyRef.current || document.activeElement !== bodyRef.current) return;
      updateActiveFormats();
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateActiveFormats() {
    try {
      setPressed({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
      });
      const block = (document.queryCommandValue("formatBlock") || "").toUpperCase();
      setActiveBlock((["H1", "H2", "H3", "BLOCKQUOTE", "PRE"].includes(block) ? block : "P") as NoteBlockTag);
    } catch {
      // queryCommandState/-Value can throw in some browsers when there's no selection yet — ignore.
    }
  }

  function flushBody() {
    if (!bodyRef.current) return;
    onUpdateNote(note.id, { contentHtml: bodyRef.current.innerHTML });
    const text = extractPlainText(bodyRef.current.innerHTML);
    setWordStats({ words: countWords(text), chars: text.length });
    setSaveStatus("saved");
  }

  function scheduleBodySave() {
    setSaveStatus("pending");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushBody, 500);
  }

  function handleBodyInput() {
    scheduleBodySave();
    updateActiveFormats();
  }

  function focusBody() {
    bodyRef.current?.focus();
  }

  function runExec(command: string, value?: string) {
    focusBody();
    document.execCommand(command, false, value);
    handleBodyInput();
  }

  function handleBodyMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const item = target.closest(".note-checklist-item") as HTMLElement | null;
    if (!item || !bodyRef.current?.contains(item)) return;
    const rect = item.getBoundingClientRect();
    // Only the checkbox glyph zone toggles — clicking further right still places a caret for editing the label.
    if (event.clientX - rect.left > 24) return;
    event.preventDefault();
    const checked = item.getAttribute("data-checked") === "true";
    item.setAttribute("data-checked", String(!checked));
    scheduleBodySave();
  }

  function handleTitleChange(value: string) {
    setTitleDraft(value);
    onUpdateNote(note.id, { title: value });
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const isMod = event.ctrlKey || event.metaKey;
    if (!isMod) return;
    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        flushBody();
      }
      setSaveStatus("flash");
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setSaveStatus("saved"), 1200);
    } else if (event.key.toLowerCase() === "z" && event.shiftKey) {
      event.preventDefault();
      runExec("redo");
    } else if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      runExec("redo");
    }
    // Ctrl+Z / Ctrl+B / Ctrl+I / Ctrl+U are left to the browser's native
    // contentEditable handling — intercepting them would just double-apply.
  }

  function commitTagDraft() {
    const trimmed = tagDraft.trim();
    if (trimmed) onAddTag(note.id, trimmed);
    setTagDraft("");
    setAddingTag(false);
  }

  const menuItems = [
    { key: "duplicate", label: "Дублировать", onSelect: () => onDuplicate(note.id) },
    {
      key: "archive",
      label: note.archived ? "Вернуть из архива" : "Переместить в архив",
      onSelect: () => onToggleArchive(note.id),
    },
    { key: "export", label: "Экспорт в PDF", onSelect: () => window.print() },
    { key: "delete", label: "Удалить", destructive: true, onSelect: () => onDelete(note.id) },
  ];

  const saveLabel =
    saveStatus === "pending" ? "Сохранение…" : saveStatus === "flash" ? "Уже сохранено ✓" : `Сохранено · ${formatNoteDateLabel(note.updatedAt, now)}`;

  return (
    <div className="note-print-area flex h-full min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="shrink-0 p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <input
            value={titleDraft}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="Без названия"
            className="min-w-0 flex-1 truncate border-none bg-transparent text-xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-50 dark:placeholder:text-gray-700"
          />
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onTogglePin(note.id)}
              aria-pressed={note.pinned}
              aria-label={note.pinned ? "Открепить" : "Закрепить"}
              className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-50 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-600 dark:hover:bg-gray-800"
            >
              <Pin size={17} className={note.pinned ? "fill-gray-500 text-gray-500 dark:fill-gray-400 dark:text-gray-400" : undefined} />
            </button>
            <button
              type="button"
              onClick={() => onToggleStar(note.id)}
              aria-pressed={note.starred}
              aria-label={note.starred ? "Убрать из избранного" : "Добавить в избранное"}
              className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-50 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-600 dark:hover:bg-gray-800"
            >
              <Star size={18} className={note.starred ? "fill-amber-400 text-amber-400" : undefined} />
            </button>
            <DropdownMenu
              trigger={<MoreVertical size={18} />}
              triggerClassName="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              triggerAriaLabel="Действия с заметкой"
              items={menuItems}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "group flex h-7 items-center gap-1 rounded-full border border-transparent pl-2.5 pr-1 text-xs font-medium",
                calendarColorStyles[tagColorFor(tag)].block,
                calendarColorStyles[tagColorFor(tag)].text,
              )}
            >
              #{tag}
              <select
                value={tagColorFor(tag)}
                onChange={(event) => onRecolorTag(tag, event.target.value as CalendarColor)}
                aria-label={`Цвет тега ${tag}`}
                className="h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-current bg-transparent opacity-60"
              >
                {(["blue", "green", "purple", "orange", "pink", "red", "teal", "indigo"] as CalendarColor[]).map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemoveTag(note.id, tag)}
                aria-label={`Убрать тег ${tag}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-40 hover:opacity-100"
              >
                ×
              </button>
            </span>
          ))}
          {addingTag ? (
            <input
              autoFocus
              list="note-tag-suggestions"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitTagDraft();
                if (event.key === "Escape") setAddingTag(false);
              }}
              onBlur={commitTagDraft}
              placeholder="Тег…"
              className="w-24 rounded-full border border-dashed border-gray-300 bg-transparent px-2.5 py-1 text-xs text-gray-600 focus:outline-none dark:border-gray-600 dark:text-gray-300"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingTag(true)}
              aria-label="Добавить тег"
              className="rounded-full p-1.5 text-gray-400 transition-all hover:scale-105 hover:bg-gray-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-blue-400"
            >
              <Plus size={14} />
            </button>
          )}
          <datalist id="note-tag-suggestions">
            {tagDefs.map((tag) => (
              <option key={tag.label} value={tag.label} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-4 shrink-0">
        <NoteEditorToolbar
          pressed={pressed}
          activeBlock={activeBlock}
          onToggleInline={(command) => runExec(command)}
          onFormatBlock={(tag) => runExec("formatBlock", `<${tag.toLowerCase()}>`)}
          onList={(command) => runExec(command)}
          onInsertChecklist={() =>
            runExec("insertHTML", '<ul class="note-checklist"><li class="note-checklist-item" data-checked="false"><br></li></ul>')
          }
          onInsertQuote={() => runExec("formatBlock", activeBlock === "BLOCKQUOTE" ? "<p>" : "<blockquote>")}
          onInsertCode={() => runExec("formatBlock", activeBlock === "PRE" ? "<p>" : "<pre>")}
          onInsertDivider={() => runExec("insertHorizontalRule")}
          onInsertLink={() => {
            const url = window.prompt("Введите ссылку (URL):", "https://");
            const trimmed = url?.trim();
            if (!trimmed) return;
            focusBody();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
              document.execCommand("createLink", false, trimmed);
            } else {
              document.execCommand(
                "insertHTML",
                false,
                `<a href="${escapeHtml(trimmed)}" target="_blank" rel="noopener noreferrer">${escapeHtml(trimmed)}</a>`,
              );
            }
            handleBodyInput();
          }}
          onInsertImage={(dataUrl) => runExec("insertImage", dataUrl)}
          onInsertTable={() => runExec("insertHTML", TABLE_HTML)}
          onClearFormatting={() => runExec("removeFormat")}
        />
      </div>

      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleBodyInput}
        onMouseDown={handleBodyMouseDown}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            flushBody();
          }
        }}
        className="note-content min-h-0 flex-1 overflow-y-auto p-5 scroll-smooth"
      />

      <div className="shrink-0 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
          <span>{saveLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{wordStats.words} слов, {wordStats.chars} симв.</span>
          <span aria-hidden="true">·</span>
          <span>{formatReadingTime(wordStats.words)}</span>
        </p>
      </div>
    </div>
  );
}

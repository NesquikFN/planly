"use client";

import { FileText, MoreVertical, Plus, Star } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { NoteEditorToolbar } from "@/components/notes/NoteEditorToolbar";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { tagColor } from "@/lib/notes-mock-data";
import { cn } from "@/lib/utils";
import type { Note, NoteSection } from "@/types/note";

interface NoteEditorProps {
  note: Note | null;
  onToggleStar: (id: string) => void;
  onStubAction: (action: string, note: Note) => void;
  onAddTag: (note: Note) => void;
  onToggleSectionItem: (noteId: string, sectionId: string, itemId: string) => void;
  onToggleBottomItem: (noteId: string, itemId: string) => void;
}

export function NoteEditor({
  note,
  onToggleStar,
  onStubAction,
  onAddTag,
  onToggleSectionItem,
  onToggleBottomItem,
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

  const menuItems = [
    { key: "duplicate", label: "Дублировать" },
    { key: "move", label: "Переместить в архив" },
    { key: "export", label: "Экспорт в PDF" },
    { key: "delete", label: "Удалить", destructive: true },
  ].map((item) => ({
    key: item.key,
    label: item.label,
    destructive: item.destructive,
    onSelect: () => onStubAction(item.label, note),
  }));

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="shrink-0 p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 truncate text-xl font-semibold text-gray-900 dark:text-gray-50">
            {note.title}
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleStar(note.id)}
              aria-pressed={note.starred}
              aria-label={note.starred ? "Убрать из избранного" : "Добавить в избранное"}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800"
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
                "rounded-full px-2.5 py-1 text-xs font-medium",
                calendarColorStyles[tagColor(tag)].block,
                calendarColorStyles[tagColor(tag)].text,
              )}
            >
              #{tag}
            </span>
          ))}
          <button
            type="button"
            onClick={() => onAddTag(note)}
            aria-label="Добавить тег"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 shrink-0">
        <NoteEditorToolbar />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {note.sections ? (
          <RichNoteBody
            note={note}
            onToggleSectionItem={onToggleSectionItem}
            onToggleBottomItem={onToggleBottomItem}
          />
        ) : (
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{note.description}</p>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500">Последнее изменение: {note.lastEditedLabel}</p>
      </div>
    </div>
  );
}

function SectionImage({ image }: { image: NoteSection["image"] }) {
  const styles = calendarColorStyles[image.tone];
  const Icon = image.icon;
  return (
    <div
      className={cn(
        "flex h-36 w-full shrink-0 flex-col items-center justify-center gap-2 rounded-xl border sm:w-48",
        styles.block,
        styles.border,
      )}
    >
      <Icon size={26} className={styles.text} />
      <span className={cn("text-xs font-medium", styles.text)}>{image.label}</span>
    </div>
  );
}

function RichNoteBody({
  note,
  onToggleSectionItem,
  onToggleBottomItem,
}: {
  note: Note;
  onToggleSectionItem: (noteId: string, sectionId: string, itemId: string) => void;
  onToggleBottomItem: (noteId: string, itemId: string) => void;
}) {
  return (
    <div className="space-y-8">
      {note.sections!.map((section) => (
        <div key={section.id} className="flex flex-col gap-4 sm:flex-row">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{section.heading}</h2>

            {section.kind === "bullet" && (
              <ul className="mt-3 space-y-1.5">
                {section.items!.map((item) => (
                  <li
                    key={item}
                    className="relative pl-4 text-sm text-gray-600 before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-gray-300 dark:text-gray-300 dark:before:bg-gray-600"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}

            {section.kind === "numbered" && (
              <ol className="mt-3 space-y-1.5">
                {section.items!.map((item, index) => (
                  <li key={item} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="shrink-0 font-medium text-gray-400 dark:text-gray-500">{index + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            )}

            {section.kind === "checklist" && (
              <ul className="mt-3 space-y-1.5">
                {section.checklist!.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => onToggleSectionItem(note.id, section.id, item.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-0 dark:border-gray-600"
                      />
                      <span
                        className={
                          item.done
                            ? "text-gray-400 line-through dark:text-gray-500"
                            : "text-gray-600 dark:text-gray-300"
                        }
                      >
                        {item.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SectionImage image={section.image} />
        </div>
      ))}

      {(note.bottomChecklist || note.idea) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {note.bottomChecklist && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Чек-лист</h3>
              <ul className="mt-2 space-y-1.5">
                {note.bottomChecklist.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => onToggleBottomItem(note.id, item.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-0 dark:border-gray-600"
                      />
                      <span
                        className={
                          item.done
                            ? "text-gray-400 line-through dark:text-gray-500"
                            : "text-gray-600 dark:text-gray-300"
                        }
                      >
                        {item.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {note.idea && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Заметки и идеи</h3>
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                {note.idea}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

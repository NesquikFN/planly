"use client";

import { useRef } from "react";
import {
  Bold,
  Check,
  Code,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Quote,
  Strikethrough,
  Table,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";

export type NoteBlockTag = "P" | "H1" | "H2" | "H3" | "BLOCKQUOTE" | "PRE";

export interface NoteEditorToolbarHandlers {
  onToggleInline: (command: "bold" | "italic" | "underline" | "strikeThrough") => void;
  onFormatBlock: (tag: NoteBlockTag) => void;
  onList: (command: "insertUnorderedList" | "insertOrderedList") => void;
  onInsertChecklist: () => void;
  onInsertQuote: () => void;
  onInsertCode: () => void;
  onInsertDivider: () => void;
  onInsertLink: () => void;
  onInsertImage: (dataUrl: string) => void;
  onInsertTable: () => void;
  onClearFormatting: () => void;
}

interface NoteEditorToolbarProps extends NoteEditorToolbarHandlers {
  pressed: { bold: boolean; italic: boolean; underline: boolean; strike: boolean };
  activeBlock: NoteBlockTag;
}

const textStyleOptions: { label: string; tag: NoteBlockTag }[] = [
  { label: "Обычный текст", tag: "P" },
  { label: "Заголовок 1", tag: "H1" },
  { label: "Заголовок 2", tag: "H2" },
  { label: "Заголовок 3", tag: "H3" },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

function ToggleIconButton({
  icon: Icon,
  label,
  pressed,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      // Toolbar clicks must not steal focus/selection from the editable area.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-lg p-1.5 transition-colors",
        focusRing,
        pressed
          ? "bg-gray-100 text-gray-900 dark:bg-surface-2 dark:text-ink"
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-surface-2 dark:hover:text-ink-dim",
      )}
    >
      <Icon size={15} />
    </button>
  );
}

function ActionIconButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-surface-2 dark:hover:text-ink-dim",
        focusRing,
      )}
    >
      <Icon size={15} />
    </button>
  );
}

function HeadingButton({
  level,
  pressed,
  onToggle,
}: {
  level: 1 | 2 | 3;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
      aria-pressed={pressed}
      title={`Заголовок ${level}`}
      className={cn(
        "rounded-lg px-1.5 py-1 text-xs font-bold transition-colors",
        focusRing,
        pressed
          ? "bg-gray-100 text-gray-900 dark:bg-surface-2 dark:text-ink"
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-surface-2 dark:hover:text-ink-dim",
      )}
    >
      H{level}
    </button>
  );
}

export function NoteEditorToolbar({
  pressed,
  activeBlock,
  onToggleInline,
  onFormatBlock,
  onList,
  onInsertChecklist,
  onInsertQuote,
  onInsertCode,
  onInsertDivider,
  onInsertLink,
  onInsertImage,
  onInsertTable,
  onClearFormatting,
}: NoteEditorToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeStyle = textStyleOptions.find((option) => option.tag === activeBlock) ?? textStyleOptions[0];

  function handleImageFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onInsertImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-y border-gray-100 bg-white/95 px-4 py-2 backdrop-blur-sm dark:border-white/8 dark:bg-surface/95">
      <DropdownMenu
        trigger={<span className="text-xs font-semibold text-gray-500 dark:text-ink-faint">Aa</span>}
        triggerClassName={cn("rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-surface-2", focusRing)}
        align="left"
        items={textStyleOptions.map((option) => ({
          key: option.tag,
          label: option.label,
          active: activeStyle.tag === option.tag,
          onSelect: () => onFormatBlock(option.tag),
        }))}
      />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-surface-2" />

      <HeadingButton level={1} pressed={activeBlock === "H1"} onToggle={() => onFormatBlock(activeBlock === "H1" ? "P" : "H1")} />
      <HeadingButton level={2} pressed={activeBlock === "H2"} onToggle={() => onFormatBlock(activeBlock === "H2" ? "P" : "H2")} />
      <HeadingButton level={3} pressed={activeBlock === "H3"} onToggle={() => onFormatBlock(activeBlock === "H3" ? "P" : "H3")} />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-surface-2" />

      <ToggleIconButton icon={Bold} label="Жирный" pressed={pressed.bold} onToggle={() => onToggleInline("bold")} />
      <ToggleIconButton icon={Italic} label="Курсив" pressed={pressed.italic} onToggle={() => onToggleInline("italic")} />
      <ToggleIconButton icon={Underline} label="Подчёркнутый" pressed={pressed.underline} onToggle={() => onToggleInline("underline")} />
      <ToggleIconButton icon={Strikethrough} label="Зачёркнутый" pressed={pressed.strike} onToggle={() => onToggleInline("strikeThrough")} />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-surface-2" />

      <ToggleIconButton icon={List} label="Маркированный список" pressed={false} onToggle={() => onList("insertUnorderedList")} />
      <ToggleIconButton icon={ListOrdered} label="Нумерованный список" pressed={false} onToggle={() => onList("insertOrderedList")} />
      <ActionIconButton icon={Check} label="Чекбокс" onClick={onInsertChecklist} />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-surface-2" />

      <ToggleIconButton icon={Quote} label="Цитата" pressed={activeBlock === "BLOCKQUOTE"} onToggle={onInsertQuote} />
      <ToggleIconButton icon={Code} label="Код" pressed={activeBlock === "PRE"} onToggle={onInsertCode} />
      <ActionIconButton icon={Minus} label="Разделитель" onClick={onInsertDivider} />
      <ActionIconButton icon={Link} label="Ссылка" onClick={onInsertLink} />
      <ActionIconButton icon={Image} label="Изображение" onClick={() => imageInputRef.current?.click()} />
      <ActionIconButton icon={Table} label="Таблица" onClick={onInsertTable} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-surface-2" />

      <DropdownMenu
        trigger={<MoreHorizontal size={15} className="text-gray-400" />}
        triggerClassName={cn("rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-surface-2", focusRing)}
        triggerAriaLabel="Ещё"
        items={[{ key: "clear", label: "Очистить форматирование", onSelect: onClearFormatting }]}
      />
    </div>
  );
}

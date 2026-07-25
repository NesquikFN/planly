"use client";

import { useState } from "react";
import {
  Bold,
  Check,
  Code,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  MoreHorizontal,
  Quote,
  Strikethrough,
  Table,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";

const textStyles = ["Обычный текст", "Заголовок 1", "Заголовок 2", "Заголовок 3"] as const;

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
      onClick={onToggle}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-lg p-1.5 transition-colors",
        pressed
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
      )}
    >
      <Icon size={15} />
    </button>
  );
}

function StaticIconButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
    >
      <Icon size={15} />
    </button>
  );
}

function HeadingButton({ level, pressed, onToggle }: { level: 1 | 2 | 3; pressed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pressed}
      title={`Заголовок ${level}`}
      className={cn(
        "rounded-lg px-1.5 py-1 text-xs font-bold transition-colors",
        pressed
          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
      )}
    >
      H{level}
    </button>
  );
}

export function NoteEditorToolbar() {
  const [textStyle, setTextStyle] = useState<(typeof textStyles)[number]>("Обычный текст");
  const [pressed, setPressed] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setPressed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-y border-gray-100 px-4 py-2 dark:border-gray-800">
      <DropdownMenu
        trigger={<span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Aa</span>}
        triggerClassName="rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
        align="left"
        items={textStyles.map((style) => ({
          key: style,
          label: style,
          active: textStyle === style,
          onSelect: () => setTextStyle(style),
        }))}
      />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-gray-800" />

      <HeadingButton level={1} pressed={!!pressed.h1} onToggle={() => toggle("h1")} />
      <HeadingButton level={2} pressed={!!pressed.h2} onToggle={() => toggle("h2")} />
      <HeadingButton level={3} pressed={!!pressed.h3} onToggle={() => toggle("h3")} />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-gray-800" />

      <ToggleIconButton icon={Bold} label="Жирный" pressed={!!pressed.bold} onToggle={() => toggle("bold")} />
      <ToggleIconButton icon={Italic} label="Курсив" pressed={!!pressed.italic} onToggle={() => toggle("italic")} />
      <ToggleIconButton
        icon={Underline}
        label="Подчёркнутый"
        pressed={!!pressed.underline}
        onToggle={() => toggle("underline")}
      />
      <ToggleIconButton
        icon={Strikethrough}
        label="Зачёркнутый"
        pressed={!!pressed.strike}
        onToggle={() => toggle("strike")}
      />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-gray-800" />

      <ToggleIconButton
        icon={List}
        label="Маркированный список"
        pressed={!!pressed.bullet}
        onToggle={() => toggle("bullet")}
      />
      <ToggleIconButton
        icon={ListOrdered}
        label="Нумерованный список"
        pressed={!!pressed.numbered}
        onToggle={() => toggle("numbered")}
      />
      <ToggleIconButton icon={Check} label="Чекбокс" pressed={!!pressed.checkbox} onToggle={() => toggle("checkbox")} />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-gray-800" />

      <StaticIconButton icon={Quote} label="Цитата" />
      <StaticIconButton icon={Code} label="Код" />
      <StaticIconButton icon={Link} label="Ссылка" />
      <StaticIconButton icon={Image} label="Изображение" />
      <StaticIconButton icon={Table} label="Таблица" />

      <span className="mx-1 h-4 w-px bg-gray-100 dark:bg-gray-800" />

      <StaticIconButton icon={MoreHorizontal} label="Ещё" />
    </div>
  );
}

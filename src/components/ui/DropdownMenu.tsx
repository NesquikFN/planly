"use client";

import { useRef, useState, type ReactNode } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

export interface DropdownMenuItem {
  key: string;
  label: string;
  onSelect: () => void;
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  items: DropdownMenuItem[];
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  triggerClassName,
  triggerAriaLabel,
  items,
  align = "right",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
        aria-label={triggerAriaLabel}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={`absolute top-full z-20 mt-1 w-48 rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm disabled:pointer-events-none disabled:opacity-40 ${
                item.destructive
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  : item.active
                    ? "bg-accent/10 text-accent"
                    : "text-gray-600 hover:bg-gray-50 dark:text-ink-dim dark:hover:bg-surface-2"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

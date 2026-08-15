"use client";

import { useEffect, useRef, useState } from "react";
import { Clock as ClockIcon, X } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { cn } from "@/lib/utils";

export interface PlanlyTimePickerProps {
  /** "HH:mm", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  /** Defaults to `!required` — required fields hide the clear affordance. */
  allowClear?: boolean;
  placeholder?: string;
  /** Minute list step. Default 5. */
  step?: number;
  error?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

const HOURS = Array.from({ length: 24 }, (_, index) => index);

function minutesForStep(step: number): number[] {
  const count = Math.max(1, Math.floor(60 / step));
  return Array.from({ length: count }, (_, index) => index * step);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Loose keyboard entry ("930", "9:30", "09.30") normalized to "HH:mm", or null if unparsable/out of range. */
function parseTimeInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  if (trimmed.includes(":") || trimmed.includes(".")) {
    const parts = trimmed.split(/[:.]/);
    if (parts.length !== 2) return null;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return `${pad2(hours)}:${pad2(minutes)}`;
  }

  const digits = trimmed.replace(/[^0-9]/g, "");
  if (digits.length === 0) return null;
  if (digits.length <= 2) {
    const hours = Number(digits);
    if (hours > 23) return null;
    return `${pad2(hours)}:00`;
  }

  const hours = Number(digits.slice(0, digits.length - 2));
  const minutes = Number(digits.slice(-2));
  if (hours > 23 || minutes > 59) return null;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function PlanlyTimePicker({
  value,
  onChange,
  disabled,
  required,
  allowClear,
  placeholder = "--:--",
  step = 5,
  error,
  className,
  id,
  "aria-label": ariaLabel,
}: PlanlyTimePickerProps) {
  const canClear = allowClear ?? !required;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);
  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (open) {
      setDraft(value);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [open, value]);

  const [hourPart, minutePart] = value ? value.split(":") : ["", ""];
  const minuteOptions = minutesForStep(step);

  function commit(next: string) {
    onChange(next);
    setOpen(false);
  }

  function clear() {
    onChange("");
    setOpen(false);
  }

  function commitDraft() {
    const parsed = parseTimeInput(draft);
    if (parsed) commit(parsed);
    else setDraft(value); // invalid entry — revert to the last valid value
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-40 dark:bg-surface-2",
          error ? "border-red-400 dark:border-red-500/60" : "border-gray-200 dark:border-white/8",
        )}
      >
        <ClockIcon size={15} className="shrink-0 text-gray-400 dark:text-ink-faint" />
        <span className={cn("flex-1 truncate tabular-nums", value ? "text-gray-700 dark:text-ink-dim" : "text-gray-400 dark:text-ink-faint")}>
          {value || placeholder}
        </span>
        {canClear && value && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Очистить время"
            onClick={(event) => {
              event.stopPropagation();
              clear();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                clear();
              }
            }}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Выбор времени"
          className="absolute left-0 top-full z-30 mt-1 w-48 rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-white/8 dark:bg-surface"
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={draft}
            placeholder="ЧЧ:ММ"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraft();
              }
            }}
            onBlur={commitDraft}
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-center text-sm tabular-nums text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
          />

          <div className="mt-2 flex gap-1.5">
            <div className="max-h-40 flex-1 overflow-y-auto rounded-lg border border-gray-100 dark:border-white/8">
              {HOURS.map((hour) => {
                const label = pad2(hour);
                const isSelected = hourPart === label;
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => commit(`${label}:${minutePart || "00"}`)}
                    aria-pressed={isSelected}
                    className={cn(
                      "block w-full px-2 py-1 text-center text-sm tabular-nums transition-colors",
                      isSelected
                        ? "bg-accent font-semibold text-white"
                        : "text-gray-600 hover:bg-gray-100 dark:text-ink-dim dark:hover:bg-surface-2",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="max-h-40 flex-1 overflow-y-auto rounded-lg border border-gray-100 dark:border-white/8">
              {minuteOptions.map((minute) => {
                const label = pad2(minute);
                const isSelected = minutePart === label;
                return (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => commit(`${hourPart || "00"}:${label}`)}
                    aria-pressed={isSelected}
                    className={cn(
                      "block w-full px-2 py-1 text-center text-sm tabular-nums transition-colors",
                      isSelected
                        ? "bg-accent font-semibold text-white"
                        : "text-gray-600 hover:bg-gray-100 dark:text-ink-dim dark:hover:bg-surface-2",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {canClear && value && (
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full rounded-lg px-2 py-1.5 text-center text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
            >
              Очистить время
            </button>
          )}
        </div>
      )}
    </div>
  );
}

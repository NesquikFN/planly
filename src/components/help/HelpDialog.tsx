"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
}

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function HelpDialog({ open, title, children, onClose, onBack }: HelpDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label="Закрыть окно" className="absolute inset-0 cursor-default bg-gray-950/45 backdrop-blur-[1px]" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-dialog-title"
        className="relative z-10 max-h-[min(42rem,calc(100vh-2rem))] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/8 dark:bg-surface"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="help-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-ink">
            {title}
          </h2>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Закрыть" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:hover:bg-surface-2 dark:hover:text-ink-dim">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-between gap-3">
          {onBack ? <button type="button" onClick={onBack} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-ink-dim dark:hover:bg-surface-2">Назад</button> : <span />}
          <button type="button" onClick={onClose} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 active:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface">Закрыть</button>
        </div>
      </div>
    </div>
  );
}

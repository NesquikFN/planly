"use client";

import { useEffect } from "react";

export function useEscapeKey(onEscape: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onEscape]);
}

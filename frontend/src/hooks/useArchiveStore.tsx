"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import type { ArchiveItem, ArchiveItemInput } from "@/types/archive";

// The one and only archive store in the app. Deliberately generic: it knows
// nothing about Task/Note/Project/CalendarEvent shapes — every module hands
// it a plain ArchiveItemInput (entityType/entityId/title/preview/
// sourceModule/icon/color/originalData) and gets an id/deletedAt stamped on
// it. Restoring is the caller's job (they know which store `originalData`
// belongs in); this store only ever adds/removes ArchiveItem rows.
//
// Mounted at the root layout (not scoped to /archive) because Tasks/
// Calendar/Projects/Notes all call into it directly from their own delete
// functions, and the Archive page itself needs the same single instance.
//
// Backend-ready: the only localStorage-specific code is the two effects
// below. Swapping in a real API later means changing this file only — the
// public shape (items + addItem/removeItem/removeItems/clear) doesn't
// reference localStorage at all.

const ARCHIVE_STORAGE_KEY = "planly:archive";

function generateArchiveId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `archive-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface ArchiveStoreValue {
  hydrated: boolean;
  items: ArchiveItem[];
  addItem: (input: ArchiveItemInput) => ArchiveItem;
  removeItem: (id: string) => void;
  removeItems: (ids: Set<string>) => void;
  clear: () => void;
}

const ArchiveContext = createContext<ArchiveStoreValue | null>(null);

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage<ArchiveItem[] | null>(ARCHIVE_STORAGE_KEY, null);
    if (stored !== null) setItems(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(ARCHIVE_STORAGE_KEY, items);
  }, [items, hydrated]);

  const addItem = useCallback((input: ArchiveItemInput): ArchiveItem => {
    const item: ArchiveItem = { ...input, id: generateArchiveId(), deletedAt: new Date().toISOString() };
    setItems((prev) => [item, ...prev]);
    return item;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const removeItems = useCallback((ids: Set<string>) => {
    setItems((prev) => prev.filter((item) => !ids.has(item.id)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<ArchiveStoreValue>(
    () => ({ hydrated, items, addItem, removeItem, removeItems, clear }),
    [hydrated, items, addItem, removeItem, removeItems, clear],
  );

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
}

export function useArchiveStore(): ArchiveStoreValue {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchiveStore must be used within an ArchiveProvider");
  return ctx;
}

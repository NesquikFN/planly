"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import type { ProfileSettings as ProfileSettingsData } from "@/types/settings";

// Profile is intentionally its own store with its own localStorage key,
// completely separate from `planly:settings` (theme/appearance/notifications/
// etc). That separation is the fix for "saving the profile resets the
// theme" — the two used to live in one blob saved by one button.

const PROFILE_STORAGE_KEY = "planly:profile";

export interface ProfileData extends ProfileSettingsData {
  /** Data URL of the uploaded photo, or null to fall back to initials. */
  avatarDataUrl: string | null;
}

const DEFAULT_PROFILE: ProfileData = { ...DEFAULT_SETTINGS.profile, avatarDataUrl: null };

interface ProfileStoreValue {
  /** Last saved profile — what every read-only surface (Sidebar, Header, ...) should render. */
  profile: ProfileData;
  /** Working copy edited by the Profile form. */
  draft: ProfileData;
  isDirty: boolean;
  isSaving: boolean;
  updateDraft: (patch: Partial<ProfileData>) => void;
  save: () => void;
  cancel: () => void;
}

const ProfileContext = createContext<ProfileStoreValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Deterministic default on both server and first client render (no
  // localStorage read here) — avoids a hydration mismatch. The real stored
  // profile, if any, is swapped in after mount, same pattern as useTasksStore.
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const stored = readStorage<ProfileData | null>(PROFILE_STORAGE_KEY, null);
    if (stored) {
      setProfile(stored);
      setDraft(stored);
    }
  }, []);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(profile), [draft, profile]);

  function updateDraft(patch: Partial<ProfileData>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function save() {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    const next = draft;
    // No backend to await — a short delay is only so the "saving..." state
    // is actually visible, per the task's UX requirement.
    window.setTimeout(() => {
      setProfile(next);
      writeStorage(PROFILE_STORAGE_KEY, next);
      setIsSaving(false);
    }, 400);
  }

  function cancel() {
    setDraft(profile);
  }

  const value: ProfileStoreValue = { profile, draft, isDirty, isSaving, updateDraft, save, cancel };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileStore(): ProfileStoreValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfileStore must be used within a ProfileProvider");
  return ctx;
}

/** Two-letter initials from first+last name, falling back to displayName, then "?". */
export function getInitials(profile: Pick<ProfileData, "firstName" | "lastName" | "displayName">): string {
  const first = profile.firstName.trim().charAt(0);
  const last = profile.lastName.trim().charAt(0);
  const combined = `${first}${last}`.toUpperCase();
  if (combined) return combined;

  const fromDisplayName = profile.displayName.trim().charAt(0).toUpperCase();
  return fromDisplayName || "?";
}

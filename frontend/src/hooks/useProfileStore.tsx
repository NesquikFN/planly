"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import { getErrorMessage, meApi } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import type { ProfileSettings as ProfileSettingsData } from "@/types/settings";

// Single source of truth for the Profile form: the cloud `profiles` row
// (name/phone/company/bio/timezone/language/avatar) is authoritative and
// lives in useAuth(). This store only adds the handful of fields that don't
// have a column yet (contact-visibility toggles, presence status) — those
// stay local, scoped per-account via lib/storage.ts.

const PROFILE_EXTRAS_KEY = "planly:profileExtras";
// Pre-cloud local profile blob. Never written to again — read once (per
// user) to seed the cloud profile the first time it's empty. See migrateLegacyProfile.
const LEGACY_PROFILE_KEY = "planly:profile";
const MIGRATION_FLAG_PREFIX = "planly:profileMigrated:";

export interface ProfileData extends ProfileSettingsData {
  /** Data URL of the uploaded photo, or null to fall back to initials. Mirrors the cloud profile's `avatarUrl`. */
  avatarDataUrl: string | null;
}

type ProfileExtras = Pick<ProfileData, "showEmail" | "showPhone" | "allowProjectInvites" | "status">;

const DEFAULT_PROFILE: ProfileData = { ...DEFAULT_SETTINGS.profile, avatarDataUrl: null };
const DEFAULT_EXTRAS: ProfileExtras = {
  showEmail: DEFAULT_PROFILE.showEmail,
  showPhone: DEFAULT_PROFILE.showPhone,
  allowProjectInvites: DEFAULT_PROFILE.allowProjectInvites,
  status: DEFAULT_PROFILE.status,
};

interface ProfileStoreValue {
  /** Last saved profile (cloud fields + local extras) — what every read-only surface (Sidebar, Header, ...) should render. */
  profile: ProfileData;
  /** Working copy edited by the Profile form. */
  draft: ProfileData;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  updateDraft: (patch: Partial<ProfileData>) => void;
  save: () => void;
  cancel: () => void;
}

const ProfileContext = createContext<ProfileStoreValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, profile: cloud, applyProfile } = useAuth();

  const [extras, setExtras] = useState<ProfileExtras>(() => readStorage(PROFILE_EXTRAS_KEY, DEFAULT_EXTRAS));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const migratingUserId = useRef<string | null>(null);

  const profile = useMemo<ProfileData>(
    () => ({
      firstName: cloud?.firstName ?? "",
      lastName: cloud?.lastName ?? "",
      displayName: cloud?.displayName ?? cloud?.fullName ?? "",
      email: user?.email ?? "",
      phone: cloud?.phone ?? "",
      jobTitle: cloud?.jobTitle ?? "",
      company: cloud?.company ?? "",
      timezone: cloud?.timezone || DEFAULT_PROFILE.timezone,
      language: cloud?.language || DEFAULT_PROFILE.language,
      bio: cloud?.bio ?? "",
      avatarDataUrl: cloud?.avatarUrl ?? null,
      ...extras,
    }),
    [cloud, user, extras],
  );

  const [draft, setDraft] = useState<ProfileData>(profile);
  useEffect(() => setDraft(profile), [profile]);

  // One-time-per-user: if the cloud profile has no real data yet, seed it
  // from the old local (pre-cloud) profile blob so nothing typed before
  // sign-in is lost. Never overwrites a cloud profile that already has data,
  // and only ever runs once per user id (tracked by a local flag).
  useEffect(() => {
    if (!user || !cloud) return;
    if (migratingUserId.current === user.id) return;

    const flagKey = `${MIGRATION_FLAG_PREFIX}${user.id}`;
    if (readStorage(flagKey, false)) return;

    const cloudHasData = Boolean(
      cloud.firstName || cloud.lastName || cloud.displayName || cloud.phone || cloud.jobTitle || cloud.company || cloud.bio,
    );
    if (cloudHasData) {
      writeStorage(flagKey, true);
      return;
    }

    const legacy = readStorage<ProfileData | null>(LEGACY_PROFILE_KEY, null);
    if (!legacy) {
      writeStorage(flagKey, true);
      return;
    }

    migratingUserId.current = user.id;
    meApi
      .update({
        firstName: legacy.firstName || null,
        lastName: legacy.lastName || null,
        displayName: legacy.displayName || null,
        phone: legacy.phone || null,
        jobTitle: legacy.jobTitle || null,
        company: legacy.company || null,
        bio: legacy.bio || null,
        // timezone is `not null` in the schema — sending null would be
        // rejected, so an empty legacy value just means "leave as is".
        ...(legacy.timezone ? { timezone: legacy.timezone } : {}),
        avatarUrl: legacy.avatarDataUrl || null,
      })
      .then((session) => {
        writeStorage(flagKey, true);
        const migratedExtras: ProfileExtras = {
          showEmail: legacy.showEmail,
          showPhone: legacy.showPhone,
          allowProjectInvites: legacy.allowProjectInvites,
          status: legacy.status,
        };
        setExtras(migratedExtras);
        writeStorage(PROFILE_EXTRAS_KEY, migratedExtras);
        applyProfile(session.profile);
      })
      .catch(() => {
        // Not marked as done: the next mount retries. Nothing is lost —
        // the legacy blob is still in localStorage.
        migratingUserId.current = null;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cloud]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(profile), [draft, profile]);

  function updateDraft(patch: Partial<ProfileData>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  async function save() {
    if (!isDirty || isSaving || !user) return;
    setIsSaving(true);
    setSaveError(null);

    let session;
    try {
      session = await meApi.update({
        firstName: draft.firstName.trim() || null,
        lastName: draft.lastName.trim() || null,
        displayName: draft.displayName.trim() || null,
        phone: draft.phone.trim() || null,
        jobTitle: draft.jobTitle.trim() || null,
        company: draft.company.trim() || null,
        bio: draft.bio.trim() || null,
        // timezone/language are `not null` in the schema, so an empty
        // draft value means "keep the current one" rather than "clear it".
        ...(draft.timezone.trim() ? { timezone: draft.timezone.trim() } : {}),
        ...(draft.language ? { language: draft.language } : {}),
        avatarUrl: draft.avatarDataUrl,
      });
    } catch (error) {
      setIsSaving(false);
      setSaveError(getErrorMessage(error));
      return;
    }

    const nextExtras: ProfileExtras = {
      showEmail: draft.showEmail,
      showPhone: draft.showPhone,
      allowProjectInvites: draft.allowProjectInvites,
      status: draft.status,
    };
    setExtras(nextExtras);
    writeStorage(PROFILE_EXTRAS_KEY, nextExtras);

    // The PATCH already returned the saved row — no second round trip.
    applyProfile(session.profile);
    setIsSaving(false);
  }

  function cancel() {
    setDraft(profile);
    setSaveError(null);
  }

  const value: ProfileStoreValue = { profile, draft, isDirty, isSaving, saveError, updateDraft, save, cancel };

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

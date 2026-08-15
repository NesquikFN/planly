const ACTIVE_SCOPE_KEY = "planly:activeUserId";
const MIGRATED_KEY_PREFIX = "planly:migrated:";

function activeUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_SCOPE_KEY);
  } catch {
    return null;
  }
}

/** Every store already calls readStorage/writeStorage with a plain "planly:*"
 * key — this is the one place that turns it into a per-user key, so no store
 * had to be rewritten to get isolation between accounts. */
function scopedKey(key: string): string {
  const userId = activeUserId();
  return userId ? `user:${userId}:${key}` : key;
}

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(scopedKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scopedKey(key), JSON.stringify(value));
  } catch {
    // storage unavailable (e.g. private mode) — ignore, state stays in-memory
  }
}

/**
 * Points readStorage/writeStorage at this user's namespace (or back to the
 * shared unscoped location when userId is null, e.g. signed out). Must be
 * called — by AuthProvider — before any store's hydration effect runs, so
 * every store hydrates from the right account on the very first read.
 */
export function setActiveStorageScope(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) window.localStorage.setItem(ACTIVE_SCOPE_KEY, userId);
    else window.localStorage.removeItem(ACTIVE_SCOPE_KEY);
  } catch {
    // ignore
  }
}

/**
 * One-time-per-user copy of every existing unscoped "planly:*" key into this
 * user's namespace. Never overwrites data already present for this user, and
 * never deletes the legacy unscoped keys — they stay in place as a backup.
 * Safe to call on every login: the migrated flag makes every call after the
 * first a no-op.
 */
export function migrateLegacyStorageToUser(userId: string): void {
  if (typeof window === "undefined") return;
  const migratedFlag = `${MIGRATED_KEY_PREFIX}${userId}`;
  try {
    if (window.localStorage.getItem(migratedFlag)) return;

    const legacyKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("planly:") && key !== ACTIVE_SCOPE_KEY && !key.startsWith(MIGRATED_KEY_PREFIX)) {
        legacyKeys.push(key);
      }
    }

    for (const key of legacyKeys) {
      const scoped = `user:${userId}:${key}`;
      if (window.localStorage.getItem(scoped) !== null) continue; // never clobber this user's existing data
      const value = window.localStorage.getItem(key);
      if (value !== null) window.localStorage.setItem(scoped, value);
    }

    window.localStorage.setItem(migratedFlag, "1");
  } catch {
    // best-effort only — a failed migration just means this account starts fresh
  }
}

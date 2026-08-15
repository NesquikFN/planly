"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { authApi, meApi, type ApiProfile, type ApiUser } from "@/lib/api-client";
import { migrateLegacyStorageToUser, setActiveStorageScope } from "@/lib/storage";

// The one client-side source of truth for "who is signed in". The session
// itself lives in an httpOnly cookie owned by the backend — unreadable
// from here by design — so this provider never touches a token: it just
// asks GET /api/me who the cookie belongs to and mirrors the answer into
// React state, layering the per-user storage scope on top.

export type Profile = ApiProfile;
export type User = ApiUser;

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to true when the backend requires email confirmation before the first sign-in — no session was created. */
  signUp: (input: { email: string; password: string; fullName?: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Lets a caller that already has the fresh profile (useProfileStore, right after PATCH /api/me) publish it without a second round trip. */
  applyProfile: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const migratedForUser = useRef<Set<string>>(new Set());

  // Switching the storage scope is what keeps one account's local caches
  // out of another's — it has to happen before any store below this
  // provider reads from localStorage, hence the `loading` gate at the end.
  const applySession = useCallback((session: { user: User; profile: Profile } | null) => {
    setUser(session?.user ?? null);
    setProfile(session?.profile ?? null);

    if (session) {
      const userId = session.user.id;
      setActiveStorageScope(userId);
      if (!migratedForUser.current.has(userId)) {
        migrateLegacyStorageToUser(userId);
        migratedForUser.current.add(userId);
      }
    } else {
      setActiveStorageScope(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    meApi
      .get()
      .then((session) => {
        if (!active) return;
        applySession(session);
      })
      .catch(() => {
        // Backend unreachable: treat it as signed out rather than
        // hanging on the spinner forever. proxy.ts does the same, so the
        // user lands on /login with a clear failure instead of a blank page.
        if (active) applySession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      applySession(await authApi.login({ email, password }));
    },
    [applySession],
  );

  const signUp = useCallback(
    async (input: { email: string; password: string; fullName?: string }) => {
      // Registration normally signs the user straight in — the backend
      // sets the session cookie on 201. It withholds the session only
      // when it runs with REQUIRE_EMAIL_VERIFICATION on, and says so.
      const { verificationRequired, ...session } = await authApi.register(input);
      if (!verificationRequired) applySession(session);
      return verificationRequired;
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear locally even if the request failed: leaving the UI signed
      // in after the user asked to leave is the worse outcome.
      applySession(null);
    }
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    const session = await meApi.get();
    if (session) setProfile(session.profile);
  }, []);

  const applyProfile = useCallback((next: Profile) => setProfile(next), []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, loading, signIn, signUp, signOut, refreshProfile, applyProfile }),
    [user, profile, loading, signIn, signUp, signOut, refreshProfile, applyProfile],
  );

  // Block rendering (including auth pages) until the initial session
  // check — and, crucially, the storage-scope switch above — has
  // resolved. Without this gate, stores nested under this provider could
  // hydrate from the wrong (or unscoped) account for one frame.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

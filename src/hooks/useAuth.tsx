"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { migrateLegacyStorageToUser, setActiveStorageScope } from "@/lib/storage";

// The one client-side source of truth for "who is signed in" — Supabase's
// own session (via the browser client) is what's authoritative; this just
// mirrors it into React state and layers the local `profiles` row + the
// per-user storage scope on top. No token is ever read/written by hand here.

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  job_title: string | null;
  company: string | null;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Неверный email или пароль.",
  "Email not confirmed": "Подтвердите email — мы отправили письмо со ссылкой.",
  "User already registered": "Пользователь с таким email уже зарегистрирован.",
  "Password should be at least 6 characters": "Пароль должен быть не короче 6 символов.",
  "A user with this email address has already been registered": "Пользователь с таким email уже зарегистрирован.",
  "New password should be different from the old password": "Новый пароль должен отличаться от старого.",
  "Auth session missing!": "Сессия истекла. Попробуйте войти снова.",
};

/**
 * Turns a Supabase error into a user-facing message. The full error object is
 * always logged via console.error so it's debuggable regardless of env. In
 * development the real Supabase message (plus error code, if any) is
 * returned as-is — in production only a safe, mapped Russian message is.
 */
export function describeAuthError(error: unknown): string {
  console.error(error);

  const message = error instanceof Error ? error.message : String(error);
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : null;

  if (process.env.NODE_ENV !== "production") {
    return code ? `${message} (${code})` : message || "Неизвестная ошибка.";
  }

  return AUTH_ERROR_MESSAGES[message] ?? "Что-то пошло не так. Попробуйте ещё раз.";
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const migratedForUser = useRef<Set<string>>(new Set());

  const applyUser = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      const userId = nextSession.user.id;
      setActiveStorageScope(userId);
      if (!migratedForUser.current.has(userId)) {
        migrateLegacyStorageToUser(userId);
        migratedForUser.current.add(userId);
      }
      setProfile(await fetchProfile(userId));
    } else {
      setActiveStorageScope(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      await applyUser(data.session);
      if (active) setLoading(false);
    });

    // Subscribed exactly once for the life of this provider.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applyUser(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await fetchProfile(user.id));
  }, [user]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setActiveStorageScope(null);
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, profile, loading, refreshProfile, signOut }),
    [user, session, profile, loading, refreshProfile, signOut],
  );

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 text-center dark:bg-gray-950">
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-50">Supabase не настроен</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Добавьте <code>NEXT_PUBLIC_SUPABASE_URL</code> и <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> в файл{" "}
            <code>.env.local</code> (см. <code>.env.example</code>) и перезапустите приложение.
          </p>
        </div>
      </div>
    );
  }

  // Block rendering (including auth pages) until the initial session check —
  // and, crucially, the storage-scope switch above — has resolved. Without
  // this gate, stores nested under this provider could hydrate from the
  // wrong (or unscoped) account for one frame before the scope is set.
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

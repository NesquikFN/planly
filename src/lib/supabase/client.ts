"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Single browser client for all Client Components. @supabase/ssr's browser
// client stores the session in cookies (not localStorage), so the same
// session is readable server-side by src/lib/supabase/server.ts and by
// src/proxy.ts — no manual token handling anywhere in this app.

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let client: SupabaseClient | null | undefined;

/** Returns the shared browser client, or null if Supabase isn't configured. */
export function createClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  if (!isSupabaseConfigured()) {
    client = null;
    return client;
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
  return client;
}

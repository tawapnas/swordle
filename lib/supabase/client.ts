// Supabase client for the browser (Client Components). Uses the anon key and the
// browser's cookies, so it shares the session with the server-side client.
//
// Only safe to call in the browser. Guard usage on `isSupabaseConfigured()` —
// if the env vars aren't set, sign-in is unavailable but the game still works.

import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

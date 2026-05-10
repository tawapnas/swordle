// Supabase client bound to the request's cookies — for use in Server Components,
// Route Handlers, and Server Actions. Uses the anon key, so it operates under
// the signed-in user's Row-Level Security policies.
//
// Auth is optional in this app: if the Supabase env vars aren't set, the rest of
// the game still works. Callers that need auth should check `isSupabaseConfigured()`
// first (or be ready for `getUser()` to return no user).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component (cookies are read-only there).
            // Safe to ignore — the middleware refreshes the session cookie.
          }
        },
      },
    },
  );
}

/**
 * Convenience: the current authenticated user, or null. Returns null (never
 * throws) when Supabase isn't configured.
 */
export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Sign-in landing point (Supabase email magic link + OAuth providers like
// Google). The provider hands us a `code`; we exchange it for a session
// (writing the auth cookies) and redirect on. On any failure, bounce to the
// locale's /login with an error flag.
//
// This route lives under `[locale]` so the URL itself carries the user's
// language (e.g. `/en/auth/callback`, `/th/auth/callback`), which means the
// redirect targets stay in-locale automatically.

import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

const LOCALES = new Set<string>(routing.locales);

export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> },
): Promise<Response> {
  const { locale: rawLocale } = await context.params;
  const locale = LOCALES.has(rawLocale) ? rawLocale : routing.defaultLocale;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? `/${locale}`;

  if (isSupabaseConfigured() && code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL(`/${locale}/login?error=auth`, url.origin),
  );
}

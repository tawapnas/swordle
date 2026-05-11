// Composes two middlewares on every request:
//   1. next-intl locale routing — rewrites bare `/` to `/<locale>/`, validates
//      the locale segment, and sets the NEXT_LOCALE cookie that the API routes
//      read to localize puzzle content.
//   2. Supabase auth cookie refresh — calls `getUser()` so the session token is
//      kept fresh and Server Components / Route Handlers see a current session.
//
// Both must mutate the same response, so the intl response is the base and we
// layer the Supabase cookie work on top.
//
// (Next 16 renamed the `middleware` file convention to `proxy`; same mechanism.)

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // API routes are locale-neutral — they read the NEXT_LOCALE cookie themselves
  // and stay at unprefixed paths. Run only the Supabase cookie refresh on them.
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  // For non-API paths, let next-intl decide on locale routing first. It may
  // return a redirect (e.g. `/` → `/en/`) or a rewrite; we keep that response
  // as our base.
  let response = isApi
    ? NextResponse.next({ request })
    : intlMiddleware(request);

  if (!url || !anonKey) return response;

  // Layer Supabase auth cookie refresh on top, using `intlMiddleware`'s response
  // so any cookies it set (notably NEXT_LOCALE) survive.
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        // Re-init the response from the (now-updated) request, but carry
        // forward the intl response's cookies and headers so the locale
        // routing isn't lost.
        const next = NextResponse.next({ request });
        for (const cookie of response.cookies.getAll()) {
          next.cookies.set(cookie.name, cookie.value, cookie);
        }
        response.headers.forEach((value, key) => next.headers.set(key, value));
        response = next;
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};

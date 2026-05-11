// Resolve the user's locale on the server, outside of the [locale] segment.
//
// Pages and components under `app/[locale]/...` can call next-intl's
// `useLocale()` / `getLocale()` directly. API routes don't have that segment,
// so we read the `NEXT_LOCALE` cookie that next-intl's middleware writes on
// every request, falling back to the default if it's missing or malformed.

import { cookies } from "next/headers";
import { type Locale, routing } from "@/i18n/routing";

const SET = new Set<string>(routing.locales);

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get("NEXT_LOCALE")?.value;
  return raw && SET.has(raw) ? (raw as Locale) : routing.defaultLocale;
}

/** Parse a `?locale=` query param, falling back to the cookie / default. */
export async function resolveLocale(searchParam: string | null): Promise<Locale> {
  if (searchParam && SET.has(searchParam)) return searchParam as Locale;
  return getServerLocale();
}

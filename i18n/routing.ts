import { defineRouting } from "next-intl/routing";

// Locale-aware routing config. Paths look like `/en/...` and `/th/...`; bare
// `/` is redirected to the user's locale (cookie / Accept-Language) by the
// next-intl middleware in `proxy.ts`.
export const routing = defineRouting({
  locales: ["en", "th"] as const,
  defaultLocale: "en",
  // Always show the locale segment so URLs are unambiguous and shareable.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

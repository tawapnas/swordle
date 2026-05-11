"use client";

// Small "EN | ไทย" pill. Toggles the locale by swapping the leading segment of
// the current path. Routing is path-based (next-intl `localePrefix: "always"`),
// so /en/login → /th/login etc. The next-intl middleware also writes the
// NEXT_LOCALE cookie on the way through, which the API routes read.

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

const LABEL: Record<Locale, string> = {
  en: "EN",
  th: "ไทย",
};

export default function LanguageToggle() {
  const t = useTranslations("Language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    // Replace the leading `/<locale>` segment with the new locale, preserving
    // the rest of the path + any query string handled by the router.
    const re = new RegExp(`^/(?:${routing.locales.join("|")})(?=/|$)`);
    const nextPath = pathname.replace(re, `/${next}`);
    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("switchTo", { language: LABEL[locale === "en" ? "th" : "en"] })}
      className="inline-flex items-center gap-0.5 rounded-full bg-card p-0.5 text-xs font-bold shadow-sm ring-1 ring-line"
    >
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            disabled={active || pending}
            onClick={() => switchTo(l)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 transition ${
              active
                ? "bg-brand text-white"
                : "text-ink-soft hover:text-ink disabled:opacity-60"
            }`}
          >
            {LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}

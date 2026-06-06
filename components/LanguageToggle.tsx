"use client";

// Compact "🌐 EN" / "🌐 ไทย" button. Shows the current language; one tap flips to
// the other (there are only two locales, so no menu is needed). Routing is
// path-based (next-intl `localePrefix: "always"`), so /en/login → /th/login etc.
// The next-intl middleware also writes the NEXT_LOCALE cookie on the way
// through, which the API routes read.

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

  // Two locales only: the "other" one is always the switch target.
  const target: Locale = locale === "en" ? "th" : "en";

  function switchTo() {
    if (pending) return;
    // Replace the leading `/<locale>` segment with the target locale, preserving
    // the rest of the path + any query string handled by the router.
    const re = new RegExp(`^/(?:${routing.locales.join("|")})(?=/|$)`);
    const nextPath = pathname.replace(re, `/${target}`);
    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={pending}
      aria-label={t("switchTo", { language: LABEL[target] })}
      title={t("switchTo", { language: LABEL[target] })}
      className="inline-flex h-8 items-center gap-1.5 border border-line bg-white px-2.5 text-xs font-bold text-ink-soft transition hover:border-ink hover:text-ink active:translate-y-px disabled:opacity-60"
    >
      <GlobeIcon />
      {LABEL[locale]}
    </button>
  );
}

function GlobeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

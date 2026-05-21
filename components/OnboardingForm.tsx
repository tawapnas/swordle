"use client";

// Shown once, right after a user's first sign-in: collects a username, their
// Thailand province (from a picker), and an optional educational institution,
// then POSTs to /api/me/profile and drops them into the game.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  THAILAND_PROVINCES,
  provinceLabel,
  type Province,
} from "@/lib/thailand-provinces";

export default function OnboardingForm({
  email,
  initialUsername = "",
  initialProvince = "",
  initialInstitution = "",
}: {
  email: string;
  initialUsername?: string;
  initialProvince?: string;
  initialInstitution?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Onboarding");
  const [username, setUsername] = useState(initialUsername);
  const [province, setProvince] = useState(initialProvince);
  const [institution, setInstitution] = useState(initialInstitution);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Provinces sorted by the label shown in the current language.
  const provinces = useMemo(() => {
    return [...THAILAND_PROVINCES].sort((a: Province, b: Province) =>
      provinceLabel(a, locale).localeCompare(provinceLabel(b, locale), locale),
    );
  }, [locale]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          province,
          educationalInstitution: institution.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          res.status === 409 && data.error === "username-taken"
            ? t("usernameTaken")
            : t("saveFailed"),
        );
        setSubmitting(false);
        return;
      }
      router.replace(`/${locale}`);
      router.refresh();
    } catch {
      setError(t("serverUnreachable"));
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-2xl bg-card px-4 py-3 text-base text-ink shadow-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger-dark"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-bold text-ink">
          {t("username")}
        </label>
        <input
          id="username"
          name="username"
          required
          minLength={2}
          maxLength={30}
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("usernamePlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="province" className="text-sm font-bold text-ink">
          {t("province")}
        </label>
        <div className="relative">
          <select
            id="province"
            name="province"
            required
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={`${inputClass} w-full appearance-none pr-10 ${
              province ? "" : "text-ink-soft"
            }`}
          >
            <option value="" disabled>
              {t("provincePlaceholder")}
            </option>
            {provinces.map((p) => (
              <option key={p.en} value={p.en} className="text-ink">
                {provinceLabel(p, locale)}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-ink-soft"
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="institution" className="text-sm font-bold text-ink">
          {t("institution")}{" "}
          <span className="font-medium text-ink-soft">{t("optional")}</span>
        </label>
        <input
          id="institution"
          name="institution"
          autoComplete="organization"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder={t("institutionPlaceholder")}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? t("saving") : t("startPlaying")}
      </button>

      <p className="text-xs text-ink-soft">
        {t.rich("signedInAs", {
          email,
          b: (chunks) => <span className="font-medium break-all">{chunks}</span>,
        })}
      </p>
    </form>
  );
}

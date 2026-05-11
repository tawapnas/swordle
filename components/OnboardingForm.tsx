"use client";

// Shown once, right after a user's first sign-in: collects name, optional team,
// and school, then POSTs to /api/me/profile and drops them into the game.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function OnboardingForm({ email }: { email: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Onboarding");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [school, setSchool] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          teamName: teamName.trim() || null,
          school: school.trim(),
        }),
      });
      if (!res.ok) {
        setError(t("saveFailed"));
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
        <label htmlFor="firstName" className="text-sm font-bold text-ink">
          {t("firstName")}
        </label>
        <input
          id="firstName"
          name="firstName"
          required
          autoComplete="given-name"
          autoFocus
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="lastName" className="text-sm font-bold text-ink">
          {t("lastName")}
        </label>
        <input
          id="lastName"
          name="lastName"
          required
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="teamName" className="text-sm font-bold text-ink">
          {t("teamName")}{" "}
          <span className="font-medium text-ink-soft">{t("optional")}</span>
        </label>
        <input
          id="teamName"
          name="teamName"
          autoComplete="off"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={t("teamPlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="school" className="text-sm font-bold text-ink">
          {t("school")}
        </label>
        <input
          id="school"
          name="school"
          required
          autoComplete="organization"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
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

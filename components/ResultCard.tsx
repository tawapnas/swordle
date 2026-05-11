"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Trophy, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { GameResult } from "@/lib/streak";
import { formatTime, formatShare } from "@/lib/share";
import Toast from "./Toast";

/**
 * The shared "your day is done" card — used both right after playing
 * (ResultScreen) and on a repeat visit the same day (AlreadyPlayed).
 */
export default function ResultCard({
  dayNumber,
  result,
  timeMs,
  currentStreak,
  longestStreak,
  explanation,
  heading,
  showSignInCta,
}: {
  dayNumber: number;
  result: GameResult;
  timeMs: number;
  currentStreak: number;
  longestStreak: number;
  explanation?: string;
  /** Optional banner override (e.g. "You already played today"). */
  heading?: string;
  /** Show the "sign in to save your streak" CTA (signed-out only). */
  showSignInCta?: boolean;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const solved = result === "solved";
  const tBrand = useTranslations("Brand");
  const tResult = useTranslations("Result");
  const tToast = useTranslations("Toast");
  const locale = useLocale();

  async function share() {
    const text = formatShare(dayNumber, result, timeMs, currentStreak);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      /* user cancelled — fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(text);
      setToast(tToast("copied"));
    } catch {
      setToast(tToast("copied"));
    }
  }

  return (
    <div className="animate-pop flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div
        className={`flex w-full flex-col items-center gap-2 rounded-3xl px-6 py-7 text-white ${
          solved ? "bg-accent" : "bg-danger"
        }`}
      >
        <span className="text-4xl" aria-hidden>
          {solved ? "🎉" : "💡"}
        </span>
        <h2 className="text-2xl font-black">
          {heading ?? (solved ? tResult("solvedBanner") : tResult("failedBanner"))}
        </h2>
        <p className="text-sm font-medium opacity-90">
          {tBrand("name")} {tBrand("dayLabel", { day: dayNumber })}
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        <Stat
          icon={<Clock size={18} aria-hidden />}
          label={tResult("time")}
          value={formatTime(timeMs)}
        />
        <Stat
          icon={<Flame size={18} aria-hidden className="text-flame" />}
          label={tResult("currentStreak")}
          value={String(currentStreak)}
        />
        <Stat
          icon={<Trophy size={18} aria-hidden className="text-flame" />}
          label={tResult("longestStreak")}
          value={String(longestStreak)}
        />
      </div>

      {explanation ? (
        <div className="w-full rounded-2xl bg-card px-5 py-4 text-left text-sm leading-relaxed text-ink shadow-sm ring-1 ring-line">
          {explanation}
        </div>
      ) : null}

      <button
        type="button"
        onClick={share}
        className="w-full rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark"
      >
        {tResult("share")}
      </button>

      {showSignInCta ? (
        <Link
          href={`/${locale}/login`}
          className="text-sm font-bold text-brand underline-offset-2 hover:underline"
        >
          {tResult("signInCta")}
        </Link>
      ) : null}

      <p className="text-sm text-ink-soft">{tResult("comeBackTomorrow")}</p>

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card px-2 py-3 shadow-sm ring-1 ring-line">
      {icon}
      <span className="text-lg font-black tabular-nums text-ink">{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </span>
    </div>
  );
}

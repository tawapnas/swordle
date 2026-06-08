"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Trophy, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { GameResult } from "@/lib/streak";
import { formatTime, formatShare } from "@/lib/share";
import Toast from "./Toast";
import SwiftCatch from "./SwiftCatch";

/** Speed tier for the win microcopy, fastest → slowest (timer caps at 60s). */
type WinTier = "blazing" | "fast" | "steady" | "clutch";
function winTier(ms: number): WinTier {
  if (ms < 7_000) return "blazing";
  if (ms < 15_000) return "fast";
  if (ms < 30_000) return "steady";
  return "clutch";
}

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
  claimable,
  birdUrl,
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
  /**
   * Whether the swift reward can be claimed: true only when the solve was
   * recorded server-side (signed in), since /api/bird verifies it. Anonymous
   * solves can't be verified, so no bird is shown for them.
   */
  claimable?: boolean;
  /** Preloaded signed URL for the swift image, so it shows without a fetch. */
  birdUrl?: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const solved = result === "solved";
  const tBrand = useTranslations("Brand");
  const tResult = useTranslations("Result");
  const tToast = useTranslations("Toast");
  const locale = useLocale();

  // Pick the win headline by how fast they solved; the variant within a tier is
  // deterministic per day so a refresh keeps the same line.
  function winHeadline(): string {
    const variants = tResult.raw(`wins.${winTier(timeMs)}`);
    if (Array.isArray(variants) && variants.length > 0) {
      return variants[dayNumber % variants.length] as string;
    }
    return tResult("solvedBanner");
  }

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
        className={`flex w-full flex-col items-center gap-2 border-2 border-ink px-6 py-7 ${
          solved || heading ? "bg-ink text-white" : "bg-white text-ink"
        }`}
      >
        <span className="text-4xl" aria-hidden>
          {solved ? "🎉" : "💡"}
        </span>
        <h2 className="text-2xl font-black uppercase tracking-wide">
          {heading ?? (solved ? winHeadline() : tResult("failedBanner"))}
        </h2>
        {!heading && (
          <p className="text-sm font-medium opacity-70">
            {tBrand("name")} {tBrand("dayLabel", { day: dayNumber })}
          </p>
        )}
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
        <div className="w-full border border-line bg-white px-5 py-4 text-left text-sm leading-relaxed text-ink">
          {explanation}
        </div>
      ) : null}

      <button
        type="button"
        onClick={share}
        className="w-full bg-brand px-6 py-3.5 text-base font-bold text-white transition active:translate-y-px active:bg-brand-dark"
      >
        {tResult("share")}
      </button>

      {solved && !heading && claimable ? (
        <SwiftCatch dayNumber={dayNumber} imageUrl={birdUrl} />
      ) : null}

      {showSignInCta ? (
        <Link
          href={`/${locale}/login`}
          className="text-sm font-bold text-brand underline-offset-2 hover:underline"
        >
          {tResult("signInCta")}
        </Link>
      ) : null}

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
    <div className="flex flex-col items-center gap-1 border border-line bg-white px-2 py-3">
      {icon}
      <span className="text-lg font-black tabular-nums text-ink">{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </span>
    </div>
  );
}

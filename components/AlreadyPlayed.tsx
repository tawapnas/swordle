"use client";

import { useTranslations } from "next-intl";
import type { GameResult } from "@/lib/streak";
import ResultCard from "./ResultCard";

/**
 * Shown on a repeat visit the same day. Streak numbers come from the server
 * when signed in, otherwise from localStorage (passed down by GamePage).
 */
export default function AlreadyPlayed({
  dayNumber,
  result,
  timeMs,
  currentStreak,
  longestStreak,
  showSignInCta,
}: {
  dayNumber: number;
  result: GameResult;
  timeMs: number;
  currentStreak: number;
  longestStreak: number;
  showSignInCta?: boolean;
}) {
  const tResult = useTranslations("Result");
  return (
    <ResultCard
      dayNumber={dayNumber}
      result={result}
      timeMs={timeMs}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      heading={tResult("alreadyPlayedTitle")}
      showSignInCta={showSignInCta}
    />
  );
}

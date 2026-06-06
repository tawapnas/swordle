"use client";

import type { GameResult } from "@/lib/streak";
import ResultCard from "./ResultCard";

/** Shown immediately after the player submits (or the timer expires). */
export default function ResultScreen({
  dayNumber,
  result,
  timeMs,
  currentStreak,
  longestStreak,
  explanation,
  showSignInCta,
  claimable,
}: {
  dayNumber: number;
  result: GameResult;
  timeMs: number;
  currentStreak: number;
  longestStreak: number;
  explanation: string;
  /** Show the "sign in to save your streak" CTA (signed-out only). */
  showSignInCta?: boolean;
  /** Whether the swift reward can be claimed (server-recorded solve). */
  claimable: boolean;
}) {
  return (
    <ResultCard
      dayNumber={dayNumber}
      result={result}
      timeMs={timeMs}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      explanation={explanation}
      showSignInCta={showSignInCta}
      claimable={claimable}
    />
  );
}

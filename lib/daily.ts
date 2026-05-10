// Deterministic daily puzzle selection.
//
// Every user worldwide sees the same puzzle on the same UTC date. Day 1 is the
// Swordle launch date (Jan 1 2026 UTC). When the bank runs out, day numbers wrap
// modulo the bank length — acceptable for MVP; flagged as a v2 follow-up.

import type { Puzzle } from "@/lib/types";

/** Swordle launch date, midnight UTC — this is "day 1". */
const EPOCH_UTC = Date.UTC(2026, 0, 1);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getTodayPuzzle(
  allPuzzles: Puzzle[],
  today: Date = new Date(),
): { puzzle: Puzzle; dayNumber: number } {
  if (allPuzzles.length === 0) {
    throw new Error("Puzzle bank is empty");
  }

  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const dayNumber = Math.floor((todayUtc - EPOCH_UTC) / MS_PER_DAY) + 1;

  // Index wraps through the bank. `((n % len) + len) % len` keeps the index
  // non-negative even for dates before the epoch.
  const len = allPuzzles.length;
  const index = (((dayNumber - 1) % len) + len) % len;

  return { puzzle: allPuzzles[index], dayNumber };
}

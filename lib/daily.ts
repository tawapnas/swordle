// Deterministic daily puzzle selection.
//
// Every user worldwide sees the same puzzle on the same UTC date. Day 1 is the
// Swordle launch date (May 22 2026 UTC). When the bank runs out, day numbers
// wrap modulo the bank length — acceptable for MVP; flagged as a v2 follow-up.

import type { Puzzle } from "@/lib/types";

/** Swordle launch date, midnight UTC — this is "day 1". */
const EPOCH_UTC = Date.UTC(2026, 4, 22);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * The 1-based Swordle day number for a date — day 1 is the launch epoch. Pure
 * and UTC-based, so every user worldwide gets the same number for a given date.
 */
export function getDayNumber(date: Date = new Date()): number {
  const dateUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.floor((dateUtc - EPOCH_UTC) / MS_PER_DAY) + 1;
}

/** Inverse of `getDayNumber` — the midnight-UTC date for a 1-based day number. */
export function dateForDayNumber(dayNumber: number): Date {
  return new Date(EPOCH_UTC + (dayNumber - 1) * MS_PER_DAY);
}

export function getTodayPuzzle(
  allPuzzles: Puzzle[],
  today: Date = new Date(),
): { puzzle: Puzzle; dayNumber: number } {
  if (allPuzzles.length === 0) {
    throw new Error("Puzzle bank is empty");
  }

  const dayNumber = getDayNumber(today);

  // Index wraps through the bank. `((n % len) + len) % len` keeps the index
  // non-negative even for dates before the epoch.
  const len = allPuzzles.length;
  const index = (((dayNumber - 1) % len) + len) % len;

  return { puzzle: allPuzzles[index], dayNumber };
}

// Deterministic daily puzzle selection.
//
// The puzzle rolls over at midnight in Thailand (Asia/Bangkok, UTC+7) — so
// everyone, wherever they are, plays the puzzle for the current Bangkok calendar
// date. Day 1 is the Swordle launch date (May 22 2026 in Bangkok). When the bank
// runs out, day numbers wrap modulo the bank length — acceptable for MVP.

import type { Puzzle } from "@/lib/types";

/** The day boundary: 00:00 Asia/Bangkok is 7 hours ahead of UTC. */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * "Day 1" is the Bangkok calendar date 2026-05-22, held as a UTC-midnight marker
 * — Bangkok calendar dates are compared as UTC-midnight markers throughout.
 */
const EPOCH = Date.UTC(2026, 4, 22);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * The 1-based Swordle day number for an instant — day 1 is the launch epoch.
 * The number ticks over at 00:00 Asia/Bangkok, so every user worldwide gets the
 * same number for a given Bangkok-local date.
 */
export function getDayNumber(date: Date = new Date()): number {
  // Shift the instant into Bangkok local time, then take its calendar date as a
  // UTC-midnight marker — so the boundary is Thai midnight, not UTC midnight.
  const local = new Date(date.getTime() + BANGKOK_OFFSET_MS);
  const marker = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  return Math.floor((marker - EPOCH) / MS_PER_DAY) + 1;
}

/** Inverse of `getDayNumber` — the instant a day begins (00:00 Asia/Bangkok). */
export function dateForDayNumber(dayNumber: number): Date {
  return new Date(EPOCH + (dayNumber - 1) * MS_PER_DAY - BANGKOK_OFFSET_MS);
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

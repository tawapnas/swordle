// localStorage-backed streak tracking for Swordle.
//
// SSR-safe: every accessor guards on `typeof window`. The stored shape is the
// `SwordleState` below, under the key `swordle:state`.

export type GameResult = "solved" | "failed";

export interface SwordleState {
  /** ISO date "2026-05-10" of the last day the player attempted a puzzle. */
  lastPlayedDate: string;
  /** The dayNumber the player last attempted (used to detect "already played"). */
  lastDayNumber: number;
  currentStreak: number;
  longestStreak: number;
  lastResult: GameResult;
  lastTimeMs: number;
}

const KEY = "swordle:state";

/** ISO date string (YYYY-MM-DD) in the player's local timezone. */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isYesterday(prevIso: string, today: Date = new Date()): boolean {
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return prevIso === isoDate(y);
}

export function readState(): SwordleState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SwordleState>;
    if (
      typeof parsed.lastPlayedDate !== "string" ||
      typeof parsed.lastDayNumber !== "number" ||
      typeof parsed.currentStreak !== "number" ||
      typeof parsed.longestStreak !== "number" ||
      (parsed.lastResult !== "solved" && parsed.lastResult !== "failed") ||
      typeof parsed.lastTimeMs !== "number"
    ) {
      return null;
    }
    return parsed as SwordleState;
  } catch {
    return null;
  }
}

function writeState(state: SwordleState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

/** True if the player has already attempted the given dayNumber today. */
export function hasPlayed(dayNumber: number): boolean {
  const s = readState();
  return s != null && s.lastDayNumber === dayNumber;
}

/**
 * Record the outcome of today's puzzle and return the updated state.
 * Streak transitions:
 *  - solved + last play was yesterday → currentStreak + 1
 *  - solved + last play older (or none) → currentStreak = 1
 *  - failed → currentStreak = 0
 *  - longestStreak bumped whenever current exceeds it
 */
export function recordResult(
  dayNumber: number,
  result: GameResult,
  timeMs: number,
): SwordleState {
  const prev = readState();
  const today = isoDate();

  let currentStreak: number;
  if (result === "failed") {
    currentStreak = 0;
  } else if (prev && isYesterday(prev.lastPlayedDate)) {
    currentStreak = prev.currentStreak + 1;
  } else {
    currentStreak = 1;
  }

  const longestStreak = Math.max(prev?.longestStreak ?? 0, currentStreak);

  const next: SwordleState = {
    lastPlayedDate: today,
    lastDayNumber: dayNumber,
    currentStreak,
    longestStreak,
    lastResult: result,
    lastTimeMs: timeMs,
  };
  writeState(next);
  return next;
}

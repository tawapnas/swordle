// Helpers for GamePage: deriving streak display + the initial phase, and the
// account fetch / legacy-import calls. Kept out of the component so it stays
// readable. Browser-only (touches localStorage via lib/streak indirectly).

import type { ImportRequest, MeResponse } from "@/lib/account";
import type { TodayResponse } from "@/lib/types";
import { hasPlayed, type GameResult, type SwordleState } from "@/lib/streak";

/** Streak numbers + whether they came from the server (signed in) or localStorage. */
export interface Streaks {
  currentStreak: number;
  longestStreak: number;
  /** True when these came from the signed-in server account. */
  fromServer: boolean;
}

export function streaksFromState(s: SwordleState): Streaks {
  return {
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    fromServer: false,
  };
}

export function streaksFromMe(m: MeResponse): Streaks {
  return {
    currentStreak: m.currentStreak,
    longestStreak: m.longestStreak,
    fromServer: true,
  };
}

/** The initial screen to show, before the player submits anything today. */
export type InitialPhase =
  | { kind: "already"; result: GameResult; timeMs: number; dayNumber: number; streaks: Streaks }
  | { kind: "playing"; dayNumber: number };

/** Decide the initial phase from today's puzzle + (optional) server account. */
export function decideInitialPhase(
  today: TodayResponse,
  me: MeResponse | null,
  local: SwordleState | null,
): InitialPhase {
  const dayNumber = today.dayNumber;
  if (me && me.lastDayNumber === dayNumber) {
    const past = me.history.find((h) => h.dayNumber === dayNumber);
    return {
      kind: "already",
      dayNumber,
      result: past ? (past.solved ? "solved" : "failed") : "solved",
      timeMs: past?.timeMs ?? local?.lastTimeMs ?? 0,
      streaks: streaksFromMe(me),
    };
  }
  if (!me && hasPlayed(dayNumber) && local) {
    return {
      kind: "already",
      dayNumber,
      result: local.lastResult,
      timeMs: local.lastTimeMs,
      streaks: streaksFromState(local),
    };
  }
  return { kind: "playing", dayNumber };
}

export async function fetchMe(): Promise<MeResponse | null> {
  try {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MeResponse;
  } catch {
    return null;
  }
}

/** One-time push of pre-account localStorage progress, if the server lacks it. */
export async function maybeImport(me: MeResponse, local: SwordleState): Promise<void> {
  if (
    me.lastDayNumber === local.lastDayNumber ||
    me.history.some((h) => h.dayNumber === local.lastDayNumber)
  ) {
    return;
  }
  const body: ImportRequest = {
    lastPlayedDate: local.lastPlayedDate,
    lastDayNumber: local.lastDayNumber,
    currentStreak: local.currentStreak,
    longestStreak: local.longestStreak,
    lastResult: local.lastResult,
    lastTimeMs: local.lastTimeMs,
  };
  try {
    await fetch("/api/me/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* offline — non-fatal, retried next visit */
  }
}

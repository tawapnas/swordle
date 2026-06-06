// Shared puzzle contract for Swordle.
//
// This file is the single source of truth for the puzzle data shape, consumed
// by both the API routes (backend) and the player UI (frontend). Keep it
// dependency-free.
//
// Two layers:
//   - `Puzzle` (server-side storage) — `prompt` and `explanation` are
//     `LocalizedString` so the bank carries both languages.
//   - `PublicPuzzle` (what GET /api/puzzle/today returns) — `prompt` is a plain
//     string resolved to the request locale by `toPublicPuzzle`. The
//     `explanation` is deliberately NOT included: it reveals the answer, so it
//     is withheld until the player submits and is returned only by
//     POST /api/puzzle/validate.

import type { Locale } from "@/i18n/routing";

/** A piece of user-facing text translated for every supported locale. */
export type LocalizedString = Record<Locale, string>;

export type PuzzleType = "spot-bug" | "fill-modifier";

interface BasePuzzle {
  /** Stable id, e.g. "2026-01-01-spotbug-01". */
  id: string;
  type: PuzzleType;
  /** Shown above the puzzle, e.g. "Which line breaks this view?". */
  prompt: LocalizedString;
  /** For future weighting; not surfaced in MVP UI. */
  difficulty: 1 | 2 | 3;
  /**
   * Which collectible swift (1–9) this puzzle rewards on a win — the image lives
   * in a private bucket, served by /api/bird after a verified solve. Optional;
   * when unset a bird is derived from the id (see lib/birds.ts).
   */
  bird?: number;
  /** Shown on the result screen — the teaching moment. */
  explanation: LocalizedString;
}

export interface SpotBugPuzzle extends BasePuzzle {
  type: "spot-bug";
  payload: { codeLines: string[] };
  answer: { buggyLineIndex: number };
}

export interface FillModifierPuzzle extends BasePuzzle {
  type: "fill-modifier";
  payload: {
    /** Code text before the blank. */
    codeBefore: string;
    /** Code text after the blank. */
    codeAfter: string;
    /** Exactly 4 modifier strings. */
    options: string[];
  };
  answer: { correctIndex: number };
}

export type Puzzle = SpotBugPuzzle | FillModifierPuzzle;

interface BasePublicPuzzle {
  id: string;
  type: PuzzleType;
  prompt: string;
  difficulty: 1 | 2 | 3;
  /** The puzzle's collectible swift (1–9), surfaced so the win screen can show it. */
  bird?: number;
}

export type PublicPuzzle =
  | (BasePublicPuzzle & Pick<SpotBugPuzzle, "type" | "payload">)
  | (BasePublicPuzzle & Pick<FillModifierPuzzle, "type" | "payload">);

/** Response shape of GET /api/puzzle/today. */
export interface TodayResponse {
  puzzle: PublicPuzzle;
  dayNumber: number;
}

/** Response shape of POST /api/puzzle/validate. */
export interface ValidateResponse {
  correct: boolean;
  explanation: string;
}

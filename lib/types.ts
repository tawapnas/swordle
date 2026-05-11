// Shared puzzle contract for Swordle.
//
// This file is the single source of truth for the puzzle data shape, consumed
// by both the API routes (backend) and the player UI (frontend). Keep it
// dependency-free.
//
// Two layers:
//   - `Puzzle` (server-side storage) — `prompt` and `explanation` are
//     `LocalizedString` so the bank carries both languages.
//   - `PublicPuzzle` (what the API returns) — `prompt` and `explanation` are
//     plain strings, already resolved to the request locale by `toPublicPuzzle`.

import type { Locale } from "@/i18n/routing";

/** A piece of user-facing text translated for every supported locale. */
export type LocalizedString = Record<Locale, string>;

export type PuzzleType =
  | "spot-bug"
  | "predict-render"
  | "fill-modifier"
  | "syntax-sort";

interface BasePuzzle {
  /** Stable id, e.g. "2026-01-01-spotbug-01". */
  id: string;
  type: PuzzleType;
  /** Shown above the puzzle, e.g. "Which line breaks this view?". */
  prompt: LocalizedString;
  /** For future weighting; not surfaced in MVP UI. */
  difficulty: 1 | 2 | 3;
  /** Shown on the result screen — the teaching moment. */
  explanation: LocalizedString;
}

export interface SpotBugPuzzle extends BasePuzzle {
  type: "spot-bug";
  payload: { codeLines: string[] };
  answer: { buggyLineIndex: number };
}

export interface PredictRenderPuzzle extends BasePuzzle {
  type: "predict-render";
  payload: {
    code: string;
    /** Exactly 4 options. `mockupSvg` is inline SVG markup. */
    options: { id: string; mockupSvg: string }[];
  };
  answer: { correctOptionId: string };
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

export interface SyntaxSortPuzzle extends BasePuzzle {
  type: "syntax-sort";
  payload: { shuffledLines: string[] };
  /** Indices into `shuffledLines`, in the order they should appear. */
  answer: { correctOrder: number[] };
}

export type Puzzle =
  | SpotBugPuzzle
  | PredictRenderPuzzle
  | FillModifierPuzzle
  | SyntaxSortPuzzle;

interface BasePublicPuzzle {
  id: string;
  type: PuzzleType;
  prompt: string;
  difficulty: 1 | 2 | 3;
  explanation: string;
}

export type PublicPuzzle =
  | (BasePublicPuzzle & Pick<SpotBugPuzzle, "type" | "payload">)
  | (BasePublicPuzzle & Pick<PredictRenderPuzzle, "type" | "payload">)
  | (BasePublicPuzzle & Pick<FillModifierPuzzle, "type" | "payload">)
  | (BasePublicPuzzle & Pick<SyntaxSortPuzzle, "type" | "payload">);

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

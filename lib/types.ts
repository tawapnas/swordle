// Shared puzzle contract for Swordle.
//
// This file is the single source of truth for the puzzle data shape, consumed
// by both the API routes (backend) and the player UI (frontend). The
// backend-engineer owns the canonical version; the frontend imports it
// read-only. Keep it dependency-free.

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
  prompt: string;
  /** For future weighting; not surfaced in MVP UI. */
  difficulty: 1 | 2 | 3;
  /** Shown on the result screen — the teaching moment. */
  explanation: string;
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

/** What the API returns to the client — never includes `answer`. */
export type PublicPuzzle =
  | Omit<SpotBugPuzzle, "answer">
  | Omit<PredictRenderPuzzle, "answer">
  | Omit<FillModifierPuzzle, "answer">
  | Omit<SyntaxSortPuzzle, "answer">;

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

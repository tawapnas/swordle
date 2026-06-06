// Mapping between a `public.puzzles` table row and the `Puzzle` type.
//
// The jsonb columns come back from supabase-js as already-parsed `unknown`, so
// every row is run through `parsePuzzleInput` — a hand-edited or malformed row
// is logged and dropped rather than crashing the daily route.

import type { Puzzle } from "@/lib/types";
import { parsePuzzleInput } from "@/lib/puzzle-schema";

/** Shape of a row selected from `public.puzzles`. */
export interface PuzzleRow {
  id: string;
  type: string;
  prompt: unknown;
  difficulty: number;
  /** Collectible swift 1–9, nullable in the DB ("derive from id"). */
  bird?: number | null;
  payload: unknown;
  answer: unknown;
  explanation: unknown;
  is_published?: boolean;
  // Scheduling metadata, not puzzle content — the data-access layer owns it.
  // `rowToPuzzle`/`puzzleToRow` deliberately ignore it (an UPDATE never
  // reschedules a puzzle). Documented here only for selects that need it.
  sort_order?: number;
}

/** Convert a DB row to a `Puzzle`, or `null` if the row doesn't validate. */
export function rowToPuzzle(row: PuzzleRow): Puzzle | null {
  const parsed = parsePuzzleInput({
    id: row.id,
    type: row.type,
    prompt: row.prompt,
    difficulty: row.difficulty,
    bird: row.bird ?? undefined,
    payload: row.payload,
    answer: row.answer,
    explanation: row.explanation,
  });
  if (!parsed.ok) {
    console.error(
      `[puzzles] skipping malformed row "${row.id}": ${parsed.errors.join("; ")}`,
    );
    return null;
  }
  return parsed.puzzle;
}

/** Convert a `Puzzle` to a row object for insert/upsert into `public.puzzles`. */
export function puzzleToRow(p: Puzzle, isPublished = true) {
  return {
    id: p.id,
    type: p.type,
    prompt: p.prompt,
    difficulty: p.difficulty,
    bird: p.bird ?? null,
    payload: p.payload,
    answer: p.answer,
    explanation: p.explanation,
    is_published: isPublished,
  };
}

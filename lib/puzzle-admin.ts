import "server-only";

// Server-side puzzle bank mutations for the /admin UI. Uses the SERVICE-ROLE
// client (the `puzzles` table has RLS on with no policies — answers stay
// server-side). Callers must already be authorized (see lib/admin-guard.ts).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Puzzle } from "@/lib/types";
import { rowToPuzzle, puzzleToRow, type PuzzleRow } from "@/lib/puzzle-row";

/**
 * All puzzles in SCHEDULE order — sorted by `sort_order` ascending (with `id`
 * as a stable tiebreaker), so the day number of a puzzle is its array index + 1.
 * Includes unpublished ones (admin view).
 */
export async function listAllPuzzles(): Promise<Puzzle[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("puzzles")
      .select("id, type, prompt, difficulty, payload, answer, explanation, is_published")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (error) {
      console.error("[puzzle-admin] listAllPuzzles:", error);
      return [];
    }
    const out: Puzzle[] = [];
    for (const row of (data ?? []) as PuzzleRow[]) {
      const p = rowToPuzzle(row);
      if (p) out.push(p);
    }
    return out;
  } catch (err) {
    console.error("[puzzle-admin] listAllPuzzles failed:", err);
    return [];
  }
}

/**
 * Insert a new puzzle, scheduling it at `position` (a 1-based day slot). When
 * `position` is omitted — or beyond the end of the bank — the puzzle is
 * appended. Otherwise the existing puzzles at/after `position` shift down one
 * slot so the schedule stays contiguous.
 *
 * Rejects (re-throws) on a duplicate id so the route can map Postgres error
 * 23505 to a 409. Uses `insert`, not `upsert` — creating should fail loudly
 * rather than silently overwrite. (A `sort_order` unique-violation would also
 * surface as 23505 — acceptable, the route reports a generic 409.)
 */
export async function createPuzzle(p: Puzzle, position?: number): Promise<void> {
  const admin = createSupabaseAdminClient();

  // Current highest occupied slot (null when the bank is empty).
  const { data: maxRow, error: maxErr } = await admin
    .from("puzzles")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) throw maxErr;
  const max: number = maxRow?.sort_order ?? 0;

  let sortOrder: number;
  if (position === undefined || position > max) {
    // Append to the end.
    sortOrder = max + 1;
  } else {
    // Insert into the middle: clamp, make room, then place.
    sortOrder = Math.min(Math.max(position, 1), max + 1);
    const { error: shiftErr } = await admin.rpc("puzzles_shift_for_insert", {
      p_position: sortOrder,
    });
    if (shiftErr) throw shiftErr;
  }

  const { error } = await admin
    .from("puzzles")
    .insert({ ...puzzleToRow(p), sort_order: sortOrder });
  if (error) throw error;
}

/** Update an existing puzzle by id. Returns true if a row was updated. */
export async function updatePuzzle(p: Puzzle): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  // `puzzleToRow` omits `sort_order`, so an UPDATE never reschedules the puzzle.
  const { data, error } = await admin
    .from("puzzles")
    .update(puzzleToRow(p))
    .eq("id", p.id)
    .select("id");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

/**
 * Delete a puzzle by id. Returns true if a row was removed. After the delete the
 * gap it left in the `sort_order` sequence is closed so the schedule stays
 * contiguous.
 */
export async function deletePuzzle(id: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();

  // Read the slot first so we know which gap to close.
  const { data: existing, error: readErr } = await admin
    .from("puzzles")
    .select("id, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw readErr;

  const { data, error } = await admin
    .from("puzzles")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;

  const removed = Array.isArray(data) && data.length > 0;
  if (removed && typeof existing?.sort_order === "number") {
    const { error: gapErr } = await admin.rpc("puzzles_close_gap", {
      p_deleted_order: existing.sort_order,
    });
    if (gapErr) throw gapErr;
  }
  return removed;
}

/**
 * Reschedule the entire puzzle bank. `orderedIds` is the full list of puzzle ids
 * in the desired order — they become `sort_order` 1, 2, 3… in one bulk update.
 * The DB function rejects a list that doesn't cover every puzzle exactly once.
 */
export async function reorderPuzzles(orderedIds: string[]): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("puzzles_reorder", { p_ids: orderedIds });
  if (error) throw error;
}

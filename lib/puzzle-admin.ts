import "server-only";

// Server-side puzzle bank mutations for the /admin UI. Uses the SERVICE-ROLE
// client (the `puzzles` table has RLS on with no policies — answers stay
// server-side). Callers must already be authorized (see lib/admin-guard.ts).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Puzzle } from "@/lib/types";
import { rowToPuzzle, puzzleToRow, type PuzzleRow } from "@/lib/puzzle-row";

/** All puzzles, ordered by id — includes unpublished ones (admin view). */
export async function listAllPuzzles(): Promise<Puzzle[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("puzzles")
      .select("id, type, prompt, difficulty, payload, answer, explanation, is_published")
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
 * Insert a new puzzle. Rejects (re-throws) on a duplicate id so the route can
 * map Postgres error 23505 to a 409. Uses `insert`, not `upsert` — creating
 * should fail loudly rather than silently overwrite.
 */
export async function createPuzzle(p: Puzzle): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("puzzles").insert(puzzleToRow(p));
  if (error) throw error;
}

/** Delete a puzzle by id. Returns true if a row was removed. */
export async function deletePuzzle(id: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("puzzles")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

import "server-only";

// Data-access layer for puzzles.
//
// API routes import this — never `data/puzzles.json` directly — so the storage
// backend can be swapped without touching route handlers.
//
// Two backends:
//   - `jsonPuzzleStore` — the bundled `data/puzzles.json`, imported statically
//     so Node parses it once at module-eval time (cached for the process life).
//     Used when Supabase isn't configured. It also doubles as the seed source
//     for the Supabase table (`npm run seed:puzzles`).
//
//     NOTE: explicit admin day scheduling (the `sort_order` column) is a
//     Supabase-only feature. The JSON fallback has no `sort_order` — the daily
//     rotation simply follows file order in `data/puzzles.json`.
//   - `supabasePuzzleStore` — reads `public.puzzles` via the SERVICE-ROLE client
//     (the table has RLS on with no select policy — answers must stay
//     server-side). Used when `SUPABASE_SERVICE_ROLE_KEY` is set.
//
// `getPuzzleStore()` picks between them. Callers should use it rather than
// importing a concrete store.

import { cache } from "react";
import type { Puzzle } from "@/lib/types";
import puzzlesData from "@/data/puzzles.json";
import { createSupabaseAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { rowToPuzzle, type PuzzleRow } from "@/lib/puzzle-row";

export interface PuzzleStore {
  getAll(): Promise<Puzzle[]>;
  getById(id: string): Promise<Puzzle | null>;
}

// `resolveJsonModule` types the import as a structural literal; the JSON is
// authored to match the `Puzzle` union, so this assertion is the one place we
// bridge the two. If the JSON drifts from the type, fix the JSON.
const puzzles = puzzlesData as unknown as Puzzle[];

export const jsonPuzzleStore: PuzzleStore = {
  async getAll(): Promise<Puzzle[]> {
    return puzzles;
  },
  async getById(id: string): Promise<Puzzle | null> {
    return puzzles.find((p) => p.id === id) ?? null;
  },
};

// `React.cache` makes this request-scoped: every caller in one request shares a
// single DB round-trip (the today/validate routes touch the store twice), and
// the next request gets fresh data — so a puzzle created via /admin shows up
// without a redeploy. Ordered by `sort_order` (the admin-controlled schedule),
// with `id` as a stable tiebreaker, so the daily rotation is deterministic.
const loadFromSupabase = cache(async (): Promise<Puzzle[]> => {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("puzzles")
    .select("id, type, prompt, difficulty, payload, answer, explanation, is_published")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  const out: Puzzle[] = [];
  for (const row of (data ?? []) as PuzzleRow[]) {
    const p = rowToPuzzle(row);
    if (p) out.push(p);
  }
  return out;
});

export const supabasePuzzleStore: PuzzleStore = {
  async getAll(): Promise<Puzzle[]> {
    return loadFromSupabase();
  },
  async getById(id: string): Promise<Puzzle | null> {
    return (await loadFromSupabase()).find((p) => p.id === id) ?? null;
  },
};

/**
 * The active puzzle store: Supabase when the service-role key is configured
 * (reading `public.puzzles` requires it — RLS blocks the anon key), otherwise
 * the bundled JSON. So the game still runs with zero Supabase config.
 */
export function getPuzzleStore(): PuzzleStore {
  return isAdminConfigured() ? supabasePuzzleStore : jsonPuzzleStore;
}

// Data-access layer for puzzles.
//
// API routes import this interface — never `data/puzzles.json` directly — so the
// storage backend (a flat JSON file in MVP) can be swapped for SQLite/Postgres
// later without touching route handlers.
//
// Load strategy: the JSON is imported statically via an ES module import, so the
// bundler inlines it and Node parses it once at module-eval time. That means the
// puzzle bank is effectively cached for the lifetime of the server process. For
// MVP this is fine — the bank is small and only changes on redeploy. If puzzles
// ever become editable at runtime, switch `getAll()` to `fs.readFile` so edits
// are picked up without a restart.

import type { Puzzle } from "@/lib/types";
import puzzlesData from "@/data/puzzles.json";

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

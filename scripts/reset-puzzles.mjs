// DESTRUCTIVE — full reset of the puzzle bank and play history.
//
//   npm run reset:puzzles
//
// This wipes EVERY row from `public.attempts` (all player streaks / solve
// records) and `public.puzzles`, then loads the puzzles in data/puzzles.json
// fresh with a contiguous 1-based `sort_order` from their file order.
//
// Use this for a relaunch / clean slate. For a non-destructive top-up that
// keeps existing rows, use `npm run seed:puzzles` (upsert) instead.
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// environment, falling back to .env.local at the repo root.
//
// Run AFTER applying supabase/migrations/0003_puzzles.sql and
// supabase/migrations/0005_puzzle_sort_order.sql.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

// --- minimal .env.local loader (only if the vars aren't already exported) ---
function loadDotEnvLocal() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  let text;
  try {
    text = readFileSync(join(repoRoot, ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY (env or .env.local).",
  );
  process.exit(1);
}

const puzzles = JSON.parse(readFileSync(join(repoRoot, "data", "puzzles.json"), "utf8"));
if (!Array.isArray(puzzles) || puzzles.length === 0) {
  console.error("data/puzzles.json is empty or not an array.");
  process.exit(1);
}

const rows = puzzles.map((p, i) => ({
  id: p.id,
  type: p.type,
  prompt: p.prompt,
  difficulty: p.difficulty,
  payload: p.payload,
  answer: p.answer,
  explanation: p.explanation,
  is_published: true,
  sort_order: i + 1,
}));

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// `id` is the primary key on both tables and is never null, so this filter
// matches every row — supabase-js requires a filter on delete.
const matchAll = (q) => q.not("id", "is", null);

// 1. Clear play history (attempts reference puzzle_id, so they go first).
const { error: attemptsError } = await matchAll(supabase.from("attempts").delete());
if (attemptsError) {
  console.error("Failed to clear attempts:", attemptsError.message);
  process.exit(1);
}
console.log("Cleared all rows from public.attempts.");

// 2. Clear the puzzle bank.
const { error: puzzlesDeleteError } = await matchAll(supabase.from("puzzles").delete());
if (puzzlesDeleteError) {
  console.error("Failed to clear puzzles:", puzzlesDeleteError.message);
  process.exit(1);
}
console.log("Cleared all rows from public.puzzles.");

// 3. Load the fresh set.
const { error: insertError } = await supabase.from("puzzles").insert(rows);
if (insertError) {
  console.error("Failed to insert puzzles:", insertError.message);
  process.exit(1);
}

console.log(`Inserted ${rows.length} puzzles into public.puzzles (day 1 — ${rows.length}).`);
console.log("Done. Day 1 is the puzzle bank's first entry.");

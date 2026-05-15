// Seed the Supabase `public.puzzles` table from data/puzzles.json.
//
//   npm run seed:puzzles
//
// Idempotent — upserts on `id`, so it's safe to re-run after editing the JSON.
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// environment, falling back to .env.local at the repo root.
//
// Run AFTER applying supabase/migrations/0003_puzzles.sql.

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

const rows = puzzles.map((p) => ({
  id: p.id,
  type: p.type,
  prompt: p.prompt,
  difficulty: p.difficulty,
  payload: p.payload,
  answer: p.answer,
  explanation: p.explanation,
  is_published: true,
}));

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from("puzzles").upsert(rows, { onConflict: "id" });
if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${rows.length} puzzles into public.puzzles.`);

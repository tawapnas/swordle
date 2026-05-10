// POST /api/me/import
//   body: ImportRequest { lastPlayedDate, lastDayNumber, currentStreak,
//                         longestStreak, lastResult, lastTimeMs }
//   → 200 ImportResponse { imported: boolean }  (false if a row already existed)
//   → 400 on malformed body
//   → 401 if not signed in
//   → 500 on error
//
// One-shot backfill of a player's pre-accounts localStorage state: inserts a
// single attempts row for `lastDayNumber` if the server has none. Idempotent.

import type { ImportRequest, ImportResponse } from "@/lib/account";
import { getSessionUser } from "@/lib/supabase/server";
import { importLegacyAttempt } from "@/lib/account-data";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseImportRequest(value: unknown): ImportRequest | null {
  if (!isRecord(value)) return null;
  const {
    lastPlayedDate,
    lastDayNumber,
    currentStreak,
    longestStreak,
    lastResult,
    lastTimeMs,
  } = value;
  if (typeof lastPlayedDate !== "string") return null;
  if (typeof lastDayNumber !== "number" || !Number.isInteger(lastDayNumber) || lastDayNumber < 1) {
    return null;
  }
  if (typeof currentStreak !== "number" || typeof longestStreak !== "number") return null;
  if (lastResult !== "solved" && lastResult !== "failed") return null;
  if (typeof lastTimeMs !== "number" || !Number.isFinite(lastTimeMs)) return null;
  return {
    lastPlayedDate,
    lastDayNumber,
    currentStreak,
    longestStreak,
    lastResult,
    lastTimeMs,
  };
}

export async function POST(req: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = parseImportRequest(raw);
  if (!parsed) {
    return Response.json({ error: "Malformed ImportRequest" }, { status: 400 });
  }

  try {
    const imported = await importLegacyAttempt(
      user,
      parsed.lastDayNumber,
      parsed.lastResult === "solved",
      parsed.lastTimeMs,
    );
    const body: ImportResponse = { imported };
    return Response.json(body);
  } catch (err) {
    console.error("[api/me/import] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

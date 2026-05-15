// POST /api/puzzle/validate
//   body: { id: string, answer: unknown, timeMs?: number }
//   → 200 ValidateResultWithAccount { correct, explanation,
//          currentStreak?, longestStreak?, alreadyPlayed? }
//          (the account fields appear only when the request carries a session)
//   → 400 on malformed body
//   → 404 if puzzle id not found
//   → 500 on internal error
//
// The puzzle's `explanation` is returned regardless of correctness — it's the
// teaching moment. When signed in, the first attempt of the day is persisted
// (re-submits are silently ignored); any Supabase failure falls back to the
// plain { correct, explanation } response — it never breaks validation.

import type { NextRequest } from "next/server";
import type { ValidateResultWithAccount } from "@/lib/account";
import { getPuzzleStore } from "@/lib/puzzleStore";
import { validate } from "@/lib/validate";
import { getTodayPuzzle } from "@/lib/daily";
import { getSessionUser } from "@/lib/supabase/server";
import { recordValidateAttempt } from "@/lib/account-data";
import { pickLocale } from "@/lib/public";
import { resolveLocale } from "@/lib/server-locale";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.id !== "string" || !("answer" in body)) {
    return Response.json(
      { error: "Body must be { id: string, answer: unknown, timeMs?: number }" },
      { status: 400 },
    );
  }
  const timeMs = typeof body.timeMs === "number" && Number.isFinite(body.timeMs) ? body.timeMs : 0;

  try {
    const puzzles = await getPuzzleStore().getAll();
    const puzzle = puzzles.find((p) => p.id === body.id) ?? null;
    if (!puzzle) {
      return Response.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const locale = await resolveLocale(req.nextUrl.searchParams.get("locale"));
    const correct = validate(puzzle, body.answer);
    const result: ValidateResultWithAccount = {
      correct,
      explanation: pickLocale(puzzle.explanation, locale),
    };

    const user = await getSessionUser();
    if (user) {
      const { dayNumber } = getTodayPuzzle(puzzles);
      const account = await recordValidateAttempt(
        user,
        puzzle.id,
        dayNumber,
        correct,
        timeMs,
      );
      if (account) {
        result.currentStreak = account.currentStreak;
        result.longestStreak = account.longestStreak;
        result.alreadyPlayed = account.alreadyPlayed;
      }
    }

    return Response.json(result);
  } catch (err) {
    console.error("[api/puzzle/validate] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

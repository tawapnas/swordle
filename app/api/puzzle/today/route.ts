// GET /api/puzzle/today
//   → 200 { puzzle: PublicPuzzle, dayNumber: number }
//   → 500 on error
//
// In non-production environments only, a `?date=YYYY-MM-DD` query param overrides
// "today" so the daily rotation can be tested locally. A `?locale=` query param
// also overrides the cookie-derived locale for the response (useful for dev).

import type { NextRequest } from "next/server";
import type { TodayResponse } from "@/lib/types";
import { getPuzzleStore } from "@/lib/puzzleStore";
import { getTodayPuzzle } from "@/lib/daily";
import { toPublicPuzzle } from "@/lib/public";
import { resolveLocale } from "@/lib/server-locale";

// This route depends on the current date, so it must not be statically cached.
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveDate(req: NextRequest): Date {
  if (process.env.NODE_ENV === "production") return new Date();

  const raw = req.nextUrl.searchParams.get("date");
  if (!raw || !DATE_RE.test(raw)) return new Date();

  // Parse as UTC midnight; +07:00 lands at 07:00 Bangkok the same calendar day,
  // so getDayNumber still resolves to the requested date's puzzle.
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const locale = await resolveLocale(req.nextUrl.searchParams.get("locale"));
    const puzzles = await getPuzzleStore().getAll();
    const { puzzle, dayNumber } = getTodayPuzzle(puzzles, resolveDate(req));
    const body: TodayResponse = {
      puzzle: toPublicPuzzle(puzzle, locale),
      dayNumber,
    };
    return Response.json(body);
  } catch (err) {
    console.error("[api/puzzle/today] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

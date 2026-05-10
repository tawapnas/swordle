// GET /api/me
//   → 200 MeResponse  (profile + derived stats + attempt history)
//   → 401 if not signed in
//   → 500 on error
//
// Thin route: all the work is in lib/account-data.ts.

import type { MeResponse } from "@/lib/account";
import { getSessionUser } from "@/lib/supabase/server";
import { getMeData } from "@/lib/account-data";
import { jsonPuzzleStore } from "@/lib/puzzleStore";
import { getTodayPuzzle } from "@/lib/daily";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const { dayNumber } = getTodayPuzzle(await jsonPuzzleStore.getAll());
    const me: MeResponse = await getMeData(user, dayNumber);
    return Response.json(me);
  } catch (err) {
    console.error("[api/me] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

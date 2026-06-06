// GET /api/bird?day=<n>
//   Streams the collectible swift photo for day <n> (default: today) — but ONLY
//   to a signed-in player who has actually SOLVED that day's puzzle. The image
//   lives in a private Supabase Storage bucket (SUPABASE_BIRD_BUCKET, default
//   "swift"); we fetch it server-side with the service-role client and proxy the
//   bytes back same-origin, so the file is never publicly reachable and the
//   reward stays earned.
//
//   → 200 image/png
//   → 401 if not signed in
//   → 403 if the player hasn't solved that day
//   → 400 bad day · 404 no puzzle / object missing · 500 internal

import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPuzzleStore } from "@/lib/puzzleStore";
import { getTodayPuzzle, getDayNumber, dateForDayNumber } from "@/lib/daily";
import { birdObjectKey } from "@/lib/birds";

export const dynamic = "force-dynamic";

const BUCKET = process.env.SUPABASE_BIRD_BUCKET || "swift";

export async function GET(req: NextRequest): Promise<Response> {
  // Resolve the target day (default = today).
  const dayParam = req.nextUrl.searchParams.get("day");
  let day: number;
  if (dayParam === null) {
    day = getDayNumber();
  } else {
    const n = Number(dayParam);
    if (!Number.isInteger(n) || n < 1) {
      return new Response("Bad day", { status: 400 });
    }
    day = n;
  }

  try {
    // 1. Must be signed in (the RLS-bound client also scopes the attempt read).
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // 2. Must have a recorded SOLVE for that day (unique per user_id,day_number).
    const { data: attempt, error: attemptErr } = await supabase
      .from("attempts")
      .select("solved")
      .eq("user_id", user.id)
      .eq("day_number", day)
      .eq("solved", true)
      .maybeSingle();
    if (attemptErr) {
      console.error("[api/bird] attempts check:", attemptErr);
      return new Response("Internal Server Error", { status: 500 });
    }
    if (!attempt) return new Response("Forbidden", { status: 403 });

    // 3. Resolve day → puzzle → bird object key.
    const puzzles = await getPuzzleStore().getAll();
    if (puzzles.length === 0) return new Response("No puzzles", { status: 404 });
    const { puzzle } = getTodayPuzzle(puzzles, dateForDayNumber(day));
    const key = birdObjectKey(puzzle);

    // 4. Download from the private bucket with the service-role client and proxy.
    const admin = createSupabaseAdminClient();
    const { data: blob, error: dlErr } = await admin.storage
      .from(BUCKET)
      .download(key);
    if (dlErr || !blob) {
      console.error(`[api/bird] storage download "${key}":`, dlErr);
      return new Response("Not found", { status: 404 });
    }

    return new Response(await blob.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": blob.type || "image/png",
        // Per-user, gated content — never cache in shared/CDN layers.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[api/bird] failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

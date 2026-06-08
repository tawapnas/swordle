// GET /api/bird?day=<n>[&download=1]
//   Serves the collectible swift photo for day <n> (default: today) — but ONLY
//   to a signed-in player who has actually SOLVED that day's puzzle. The image
//   lives in a private Supabase Storage bucket (SUPABASE_BIRD_BUCKET, default
//   "swift"). After gating, we mint a short-lived SIGNED URL and redirect the
//   browser straight to Supabase's CDN — so the bytes never round-trip through
//   this function (faster first paint) yet the object stays private and earned.
//   `&download=1` adds a content-disposition so the tap-to-save link keeps a
//   friendly filename; the bare form is served inline for the <img> display.
//
//   → 307 redirect to a signed URL (the image)
//   → 401 if not signed in
//   → 403 if the player hasn't solved that day
//   → 400 bad day · 404 no puzzle / object missing · 500 internal

import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPuzzleStore } from "@/lib/puzzleStore";
import { getTodayPuzzle, getDayNumber, dateForDayNumber } from "@/lib/daily";
import { signBirdUrl } from "@/lib/bird-url";

export const dynamic = "force-dynamic";

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

    // 2. Must have a recorded SOLVE for that day, and resolve the bird's object
    //    key. These reads are independent, so run them together to save a hop.
    const [attemptRes, puzzles] = await Promise.all([
      supabase
        .from("attempts")
        .select("solved")
        .eq("user_id", user.id)
        .eq("day_number", day)
        .eq("solved", true)
        .maybeSingle(),
      getPuzzleStore().getAll(),
    ]);
    if (attemptRes.error) {
      console.error("[api/bird] attempts check:", attemptRes.error);
      return new Response("Internal Server Error", { status: 500 });
    }
    if (!attemptRes.data) return new Response("Forbidden", { status: 403 });
    if (puzzles.length === 0) return new Response("No puzzles", { status: 404 });

    const { puzzle } = getTodayPuzzle(puzzles, dateForDayNumber(day));

    // 3. Mint a short-lived signed URL and redirect — the browser pulls the
    //    bytes straight from Supabase's CDN rather than through this function.
    //    `&download=1` sets a content-disposition so the tap-to-save link keeps
    //    its filename; the inline form is what the <img> renders.
    const wantsDownload = req.nextUrl.searchParams.get("download") === "1";
    const signedUrl = await signBirdUrl(
      puzzle,
      wantsDownload ? { download: "swordle-swift.png" } : undefined,
    );
    if (!signedUrl) return new Response("Not found", { status: 404 });

    // Don't cache the redirect itself — the signed URL expires. Let the browser
    // and Supabase's CDN cache the underlying image bytes instead.
    return new Response(null, {
      status: 307,
      headers: { Location: signedUrl, "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    console.error("[api/bird] failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

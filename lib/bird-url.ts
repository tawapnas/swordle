import "server-only";

// Mints short-lived SIGNED URLs for a puzzle's collectible swift, pointing
// straight at Supabase Storage's CDN. Shared by:
//   - GET /api/bird        — gates the request, then redirects to one of these.
//   - POST /api/puzzle/validate — returns one inline on a fresh solve, so the
//     win screen can preload the image before it even mounts.
// The bucket is private; a signed URL is the only way the bytes are reachable,
// and it expires, so the reward stays earned.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { birdObjectKey } from "@/lib/birds";

const BUCKET = process.env.SUPABASE_BIRD_BUCKET || "swift";
const TTL_SECONDS = 60 * 60;

type PuzzleLike = { id: string; bird?: number | null };

/**
 * A signed CDN URL for the puzzle's swift, or null if storage/admin isn't
 * configured or the object is missing. Pass `download` to force a save with
 * that filename (content-disposition); omit it for inline <img> display.
 */
export async function signBirdUrl(
  puzzle: PuzzleLike,
  opts?: { download?: string },
): Promise<string | null> {
  const key = birdObjectKey(puzzle);
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(key, TTL_SECONDS, opts?.download ? { download: opts.download } : undefined);
    if (error || !data?.signedUrl) {
      console.error(`[bird-url] sign "${key}":`, error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error(`[bird-url] sign "${key}" threw:`, err);
    return null;
  }
}

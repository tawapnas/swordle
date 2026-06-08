// Share-string formatting for Swordle.

import type { GameResult } from "@/lib/streak";

const SHARE_URL = "https://swordle.swiftcodingclubth.com";

/** Format milliseconds as `m:ss` (e.g. 42_000 → "0:42"). */
export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Build the shareable result string, e.g.:
 *   "Swordle #14  ✅  0:42  🔥7\nhttps://swordle.swiftcodingclubth.com"
 * Uses ❌ for a failed attempt. The 🔥N segment is omitted when streak is 0.
 */
export function formatShare(
  dayNumber: number,
  result: GameResult,
  timeMs: number,
  streak: number,
): string {
  const mark = result === "solved" ? "✅" : "❌";
  const streakPart = streak > 0 ? `  🔥${streak}` : "";
  return `Swordle #${dayNumber}  ${mark}  ${formatTime(timeMs)}${streakPart}\n${SHARE_URL}`;
}

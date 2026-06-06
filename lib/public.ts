// Converts a full `Puzzle` (server-side storage, localized strings, carries the
// answer) into the `PublicPuzzle` the client sees: `prompt` resolved to a single
// string for the request locale, and both the `answer` AND the `explanation`
// stripped — the explanation gives the answer away, so it's withheld until the
// player submits (POST /api/puzzle/validate returns it). This is the single
// chokepoint between "has the answer / both languages" and "safe to serialize".

import type { Locale } from "@/i18n/routing";
import type { LocalizedString, Puzzle, PublicPuzzle } from "@/lib/types";
import { routing } from "@/i18n/routing";

/** Pick the localized variant; falls back to the default locale if missing. */
export function pickLocale(s: LocalizedString, locale: Locale): string {
  return s[locale] || s[routing.defaultLocale] || "";
}

export function toPublicPuzzle(puzzle: Puzzle, locale: Locale): PublicPuzzle {
  // Rebuild the object field-by-field rather than spreading, so there is no
  // way for `answer` or `explanation` (or any future secret field) to leak
  // through. Switching on the discriminant keeps the union narrowing intact for
  // the return type.
  const prompt = pickLocale(puzzle.prompt, locale);
  switch (puzzle.type) {
    case "spot-bug":
      return {
        id: puzzle.id,
        type: puzzle.type,
        prompt,
        difficulty: puzzle.difficulty,
        bird: puzzle.bird,
        payload: puzzle.payload,
      };
    case "fill-modifier":
      return {
        id: puzzle.id,
        type: puzzle.type,
        prompt,
        difficulty: puzzle.difficulty,
        bird: puzzle.bird,
        payload: puzzle.payload,
      };
    default: {
      const _exhaustive: never = puzzle;
      return _exhaustive;
    }
  }
}

// Resolves which collectible "swift" a puzzle rewards.
//
// Prefers the puzzle's authored `bird` (1..BIRD_COUNT, set in /admin); when a
// puzzle has none, derives a stable one from its `id` (keyed off `id`, never the
// day number, which rotates). The actual image lives in a PRIVATE Supabase
// Storage bucket and is only served, after a verified solve, by /api/bird — so
// this module deals in bird NUMBERS and object KEYS, never public URLs.

const BIRD_COUNT = 9;

type PuzzleLike = { id: string; bird?: number | null };

/** The puzzle's bird, 1..BIRD_COUNT. */
export function birdNumberForPuzzle({ id, bird }: PuzzleLike): number {
  if (typeof bird === "number" && bird >= 1 && bird <= BIRD_COUNT) {
    return bird;
  }
  const digits = id.match(/\d+/);
  const seed = digits
    ? parseInt(digits[0], 10)
    : [...id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (((seed - 1) % BIRD_COUNT) + BIRD_COUNT) % BIRD_COUNT + 1;
}

/** Storage object key for the puzzle's swift, e.g. "swift.003.png". */
export function birdObjectKey(puzzle: PuzzleLike): string {
  return `swift.00${birdNumberForPuzzle(puzzle)}.png`;
}

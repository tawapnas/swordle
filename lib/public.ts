// Converts a full `Puzzle` (which carries the answer) into the answer-stripped
// `PublicPuzzle` that API responses are allowed to expose. This is the single
// chokepoint between "has the answer" and "safe to serialize" — route handlers
// must pass puzzles through here before responding.

import type { Puzzle, PublicPuzzle } from "@/lib/types";

export function toPublicPuzzle(puzzle: Puzzle): PublicPuzzle {
  // Rebuild the object field-by-field rather than spreading, so there is no way
  // for `answer` (or any future secret field) to leak through. Switching on the
  // discriminant keeps the union narrowing intact for the return type.
  switch (puzzle.type) {
    case "spot-bug":
      return {
        id: puzzle.id,
        type: puzzle.type,
        prompt: puzzle.prompt,
        difficulty: puzzle.difficulty,
        explanation: puzzle.explanation,
        payload: puzzle.payload,
      };
    case "predict-render":
      return {
        id: puzzle.id,
        type: puzzle.type,
        prompt: puzzle.prompt,
        difficulty: puzzle.difficulty,
        explanation: puzzle.explanation,
        payload: puzzle.payload,
      };
    case "fill-modifier":
      return {
        id: puzzle.id,
        type: puzzle.type,
        prompt: puzzle.prompt,
        difficulty: puzzle.difficulty,
        explanation: puzzle.explanation,
        payload: puzzle.payload,
      };
    case "syntax-sort":
      return {
        id: puzzle.id,
        type: puzzle.type,
        prompt: puzzle.prompt,
        difficulty: puzzle.difficulty,
        explanation: puzzle.explanation,
        payload: puzzle.payload,
      };
    default: {
      const _exhaustive: never = puzzle;
      return _exhaustive;
    }
  }
}

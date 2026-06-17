// Answer validation — one validator per puzzle type.
//
// `userAnswer` arrives from an untrusted request body, so every validator
// defensively narrows its shape. A malformed or wrong-shape answer returns
// `false`; this function never throws.

import type { Puzzle } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validate(puzzle: Puzzle, userAnswer: unknown): boolean {
  switch (puzzle.type) {
    case "spot-bug": {
      if (!isRecord(userAnswer)) return false;
      return userAnswer.buggyLineIndex === puzzle.answer.buggyLineIndex;
    }
    case "fill-modifier": {
      if (!isRecord(userAnswer)) return false;
      return userAnswer.correctIndex === puzzle.answer.correctIndex;
    }
    case "multiple-choice": {
      if (!isRecord(userAnswer)) return false;
      return userAnswer.correctIndex === puzzle.answer.correctIndex;
    }
    default: {
      // Exhaustiveness guard — if a new puzzle type is added to the union and
      // not handled above, this line stops compiling.
      const _exhaustive: never = puzzle;
      return _exhaustive;
    }
  }
}

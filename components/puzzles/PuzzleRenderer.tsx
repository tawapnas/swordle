"use client";

import type { PublicPuzzle } from "@/lib/types";
import SpotTheBug from "./SpotTheBug";
import FillTheModifier from "./FillTheModifier";

/** Dispatches to the right puzzle component based on `puzzle.type`. */
export default function PuzzleRenderer({
  puzzle,
  onSubmit,
  disabled,
  submitting,
}: {
  puzzle: PublicPuzzle;
  onSubmit: (answer: unknown) => void;
  disabled: boolean;
  submitting: boolean;
}) {
  const props = { puzzle, onSubmit, disabled, submitting };
  switch (puzzle.type) {
    case "spot-bug":
      return <SpotTheBug {...props} />;
    case "fill-modifier":
      return <FillTheModifier {...props} />;
    default: {
      // Exhaustiveness guard — adding a PuzzleType without a case is a type error.
      const _exhaustive: never = puzzle;
      return _exhaustive;
    }
  }
}

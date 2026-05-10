"use client";

import type { PublicPuzzle } from "@/lib/types";
import SpotTheBug from "./SpotTheBug";
import PredictTheRender from "./PredictTheRender";
import FillTheModifier from "./FillTheModifier";
import SyntaxSort from "./SyntaxSort";

/** Dispatches to the right puzzle component based on `puzzle.type`. */
export default function PuzzleRenderer({
  puzzle,
  onSubmit,
  disabled,
}: {
  puzzle: PublicPuzzle;
  onSubmit: (answer: unknown) => void;
  disabled: boolean;
}) {
  const props = { puzzle, onSubmit, disabled };
  switch (puzzle.type) {
    case "spot-bug":
      return <SpotTheBug {...props} />;
    case "predict-render":
      return <PredictTheRender {...props} />;
    case "fill-modifier":
      return <FillTheModifier {...props} />;
    case "syntax-sort":
      return <SyntaxSort {...props} />;
    default: {
      // Exhaustiveness guard — adding a PuzzleType without a case is a type error.
      const _exhaustive: never = puzzle;
      return _exhaustive;
    }
  }
}

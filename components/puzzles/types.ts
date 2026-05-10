import type { PublicPuzzle } from "@/lib/types";

/**
 * Shared interface every puzzle-type component implements. Adding a 5th puzzle
 * type means: add a case to PuzzleRenderer + a component that takes these props.
 */
export interface PuzzleComponentProps {
  puzzle: PublicPuzzle;
  /** Called with the type-specific answer payload (see API contract). */
  onSubmit: (answer: unknown) => void;
  /** True once the attempt is locked in (during/after the result screen). */
  disabled: boolean;
}

// Pure (no React, no "use client") helpers for the admin puzzle form.
//
// `PuzzleFormState` is a flat "superset" of all three puzzle types' working
// fields. The form keeps everything mounted so switching type/tab never loses
// data; `formStateToInput` then projects only the active type's fields into the
// POST/PUT body. The server (`parsePuzzleInput`) remains the source of truth —
// these helpers stay permissive and surface server errors back.

import type { Puzzle, PuzzleType } from "@/lib/types";

/** A flat, editable representation of any puzzle, used by the form. */
export interface PuzzleFormState {
  // base fields
  id: string;
  type: PuzzleType;
  difficulty: 1 | 2 | 3;
  /** Reward swift 1–9, or null for "auto-derive from id". */
  bird: number | null;
  promptEn: string;
  promptTh: string;
  explanationEn: string;
  explanationTh: string;

  // spot-bug working fields
  codeLinesText: string;
  buggyLineIndex: number | null;

  // fill-modifier working fields
  codeBefore: string;
  codeAfter: string;
  options: string[]; // always length 4
  // Index of the correct option — shared by fill-modifier and multiple-choice
  // (both pick one of 4); only one type is active at a time.
  correctIndex: number | null;

  // multiple-choice working fields — localized choices, always length 4 each.
  choicesEn: string[];
  choicesTh: string[];
}

/** Split a textarea value into lines, dropping a single trailing blank line. */
export function toLines(text: string): string[] {
  return text.replace(/\n+$/, "").split("\n");
}

/** A fresh, blank form state with sensible defaults. */
export function emptyFormState(): PuzzleFormState {
  return {
    id: "",
    type: "spot-bug",
    difficulty: 1,
    bird: null,
    promptEn: "",
    promptTh: "",
    explanationEn: "",
    explanationTh: "",
    codeLinesText: "",
    buggyLineIndex: null,
    codeBefore: "",
    codeAfter: "",
    options: ["", "", "", ""],
    correctIndex: null,
    choicesEn: ["", "", "", ""],
    choicesTh: ["", "", "", ""],
  };
}

/** Build a form state from an existing puzzle (edit mode). */
export function puzzleToFormState(p: Puzzle): PuzzleFormState {
  const base: PuzzleFormState = {
    ...emptyFormState(),
    id: p.id,
    type: p.type,
    difficulty: p.difficulty,
    bird: p.bird ?? null,
    promptEn: p.prompt.en,
    promptTh: p.prompt.th,
    explanationEn: p.explanation.en,
    explanationTh: p.explanation.th,
  };

  if (p.type === "spot-bug") {
    return {
      ...base,
      codeLinesText: p.payload.codeLines.join("\n"),
      buggyLineIndex: p.answer.buggyLineIndex,
    };
  }
  if (p.type === "fill-modifier") {
    return {
      ...base,
      codeBefore: p.payload.codeBefore,
      codeAfter: p.payload.codeAfter,
      options: [
        p.payload.options[0] ?? "",
        p.payload.options[1] ?? "",
        p.payload.options[2] ?? "",
        p.payload.options[3] ?? "",
      ],
      correctIndex: p.answer.correctIndex,
    };
  }
  // multiple-choice (the only other type).
  return {
    ...base,
    choicesEn: [0, 1, 2, 3].map((i) => p.payload.choices[i]?.en ?? ""),
    choicesTh: [0, 1, 2, 3].map((i) => p.payload.choices[i]?.th ?? ""),
    correctIndex: p.answer.correctIndex,
  };
}

/**
 * Project a form state into the POST/PUT body. Trims base fields, builds clean
 * `prompt`/`explanation` objects, omits a blank `id`, and includes only the
 * active type's `payload`/`answer`.
 */
export function formStateToInput(s: PuzzleFormState): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: s.type,
    difficulty: s.difficulty,
    prompt: { en: s.promptEn.trim(), th: s.promptTh.trim() },
    explanation: { en: s.explanationEn.trim(), th: s.explanationTh.trim() },
  };
  if (s.id.trim()) base.id = s.id.trim();
  if (s.bird != null) base.bird = s.bird;

  if (s.type === "spot-bug") {
    return {
      ...base,
      payload: { codeLines: toLines(s.codeLinesText) },
      answer: { buggyLineIndex: s.buggyLineIndex },
    };
  }
  if (s.type === "fill-modifier") {
    return {
      ...base,
      payload: {
        codeBefore: s.codeBefore,
        codeAfter: s.codeAfter,
        options: s.options,
      },
      answer: { correctIndex: s.correctIndex },
    };
  }
  // multiple-choice (the only other type) — pair up the per-locale choice
  // inputs into localized objects.
  return {
    ...base,
    payload: {
      choices: [0, 1, 2, 3].map((i) => ({
        en: s.choicesEn[i]?.trim() ?? "",
        th: s.choicesTh[i]?.trim() ?? "",
      })),
    },
    answer: { correctIndex: s.correctIndex },
  };
}

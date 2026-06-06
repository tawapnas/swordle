// Runtime validation for a full, untrusted `Puzzle` payload — used by the admin
// create-puzzle route and by the DB-row mapper (`lib/puzzle-row.ts`). This is
// the *whole-puzzle* counterpart to `lib/validate.ts`, which only checks an
// answer against a known-good puzzle.
//
// Dependency-light on purpose (only types + routing) — safe to import anywhere.

import type {
  FillModifierPuzzle,
  LocalizedString,
  Puzzle,
  PuzzleType,
  SpotBugPuzzle,
} from "@/lib/types";
import { routing } from "@/i18n/routing";

export type ParseResult =
  | { ok: true; puzzle: Puzzle }
  | { ok: false; errors: string[] };

const PUZZLE_TYPES: readonly PuzzleType[] = ["spot-bug", "fill-modifier"];

const ID_RE = /^[a-z0-9-]+$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isInteger(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v);
}

function isLocalizedString(v: unknown): v is LocalizedString {
  if (!isRecord(v)) return false;
  const keys = Object.keys(v);
  if (keys.length !== routing.locales.length) return false;
  return routing.locales.every((loc) => isNonEmptyString(v[loc]));
}

/**
 * Validate an untrusted object as a `Puzzle`. Collects *all* problems (rather
 * than bailing on the first) so a form can show them together. On success the
 * puzzle is rebuilt field-by-field — unknown keys are dropped.
 */
export function parsePuzzleInput(input: unknown): ParseResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ["Puzzle must be an object."] };
  }

  // id
  if (!isNonEmptyString(input.id)) {
    errors.push("`id` is required and must be a non-empty string.");
  } else if (!ID_RE.test(input.id)) {
    errors.push("`id` may only contain lowercase letters, digits and hyphens.");
  }

  // type
  const type = input.type;
  if (typeof type !== "string" || !PUZZLE_TYPES.includes(type as PuzzleType)) {
    errors.push(
      `\`type\` must be one of: ${PUZZLE_TYPES.map((t) => `"${t}"`).join(", ")}.`,
    );
  }

  // difficulty
  if (input.difficulty !== 1 && input.difficulty !== 2 && input.difficulty !== 3) {
    errors.push("`difficulty` must be 1, 2 or 3.");
  }

  // bird — optional reward image (1..9). Absent/null means "derive from id".
  if (
    input.bird !== undefined &&
    input.bird !== null &&
    (!isInteger(input.bird) || input.bird < 1 || input.bird > 9)
  ) {
    errors.push("`bird` must be an integer between 1 and 9.");
  }

  // prompt / explanation
  if (!isLocalizedString(input.prompt)) {
    errors.push(
      `\`prompt\` must have a non-empty string for each locale: ${routing.locales.join(", ")}.`,
    );
  }
  if (!isLocalizedString(input.explanation)) {
    errors.push(
      `\`explanation\` must have a non-empty string for each locale: ${routing.locales.join(", ")}.`,
    );
  }

  // payload / answer (type-specific)
  const payload = isRecord(input.payload) ? input.payload : null;
  const answer = isRecord(input.answer) ? input.answer : null;
  if (!payload) errors.push("`payload` must be an object.");
  if (!answer) errors.push("`answer` must be an object.");

  if (type === "spot-bug") {
    if (payload) {
      if (!isStringArray(payload.codeLines) || payload.codeLines.length === 0) {
        errors.push("`payload.codeLines` must be a non-empty array of strings.");
      } else if (answer) {
        if (
          !isInteger(answer.buggyLineIndex) ||
          answer.buggyLineIndex < 0 ||
          answer.buggyLineIndex >= payload.codeLines.length
        ) {
          errors.push(
            "`answer.buggyLineIndex` must be an integer index into `payload.codeLines`.",
          );
        }
      }
    }
  } else if (type === "fill-modifier") {
    if (payload) {
      if (typeof payload.codeBefore !== "string") {
        errors.push("`payload.codeBefore` must be a string.");
      }
      if (typeof payload.codeAfter !== "string") {
        errors.push("`payload.codeAfter` must be a string.");
      }
      if (
        !isStringArray(payload.options) ||
        payload.options.length !== 4 ||
        !payload.options.every((o) => o.trim().length > 0)
      ) {
        errors.push("`payload.options` must be exactly 4 non-empty strings.");
      }
    }
    if (answer) {
      if (!isInteger(answer.correctIndex) || answer.correctIndex < 0 || answer.correctIndex > 3) {
        errors.push("`answer.correctIndex` must be an integer between 0 and 3.");
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  // Safe to assert now — rebuild field-by-field, dropping unknown keys.
  const base = {
    id: (input.id as string).trim(),
    prompt: pickLocales(input.prompt as LocalizedString),
    difficulty: input.difficulty as 1 | 2 | 3,
    explanation: pickLocales(input.explanation as LocalizedString),
    ...(typeof input.bird === "number" ? { bird: input.bird } : {}),
  };

  let puzzle: Puzzle;
  if (type === "spot-bug") {
    const p = input.payload as { codeLines: string[] };
    const a = input.answer as { buggyLineIndex: number };
    puzzle = {
      ...base,
      type: "spot-bug",
      payload: { codeLines: [...p.codeLines] },
      answer: { buggyLineIndex: a.buggyLineIndex },
    } satisfies SpotBugPuzzle;
  } else {
    // fill-modifier — the only other valid type (validated above).
    const p = input.payload as { codeBefore: string; codeAfter: string; options: string[] };
    const a = input.answer as { correctIndex: number };
    puzzle = {
      ...base,
      type: "fill-modifier",
      payload: { codeBefore: p.codeBefore, codeAfter: p.codeAfter, options: [...p.options] },
      answer: { correctIndex: a.correctIndex },
    } satisfies FillModifierPuzzle;
  }

  return { ok: true, puzzle };
}

function pickLocales(v: LocalizedString): LocalizedString {
  const out = {} as LocalizedString;
  for (const loc of routing.locales) out[loc] = v[loc];
  return out;
}

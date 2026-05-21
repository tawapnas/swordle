"use client";

// Create / edit a single puzzle. Holds one flat `PuzzleFormState` (see
// lib/puzzle-form.ts) so switching puzzle type never drops in-progress data.
// The server (parsePuzzleInput) is the source of truth for validation — this
// form sends a best-effort body and surfaces any errors it gets back.

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Puzzle, PuzzleType } from "@/lib/types";
import {
  emptyFormState,
  formStateToInput,
  puzzleToFormState,
  type PuzzleFormState,
} from "@/lib/puzzle-form";
import { Field, inputClass, monoInputClass } from "./puzzle-fields/styles";
import SpotBugFields from "./puzzle-fields/SpotBugFields";
import FillModifierFields from "./puzzle-fields/FillModifierFields";
import SyntaxSortFields from "./puzzle-fields/SyntaxSortFields";

export default function PuzzleForm({
  initial,
  currentDay,
  onDone,
  onCancel,
}: {
  initial?: Puzzle;
  currentDay?: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("Admin.puzzles");
  const isEdit = initial != null;

  const [state, setState] = useState<PuzzleFormState>(() =>
    initial ? puzzleToFormState(initial) : emptyFormState(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  function patch(p: Partial<PuzzleFormState>) {
    setState((s) => ({ ...s, ...p }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setErrors([]);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/puzzles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formStateToInput(state)),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          errors?: string[];
        };
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setErrors(data.errors);
        } else {
          setError(data.error ?? t(isEdit ? "saveFailed" : "createFailed"));
        }
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
      onDone();
    } catch {
      setError(t(isEdit ? "saveFailed" : "createFailed"));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl bg-card px-5 py-5 ring-1 ring-line"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-black text-ink">
          {isEdit ? t("editTitle") : t("create")}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-3 py-1.5 text-sm font-bold text-ink-soft transition hover:bg-line/40 hover:text-ink"
        >
          {t("cancel")}
        </button>
      </div>

      {success && (
        <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm font-medium text-brand-dark">
          {t(isEdit ? "updated" : "created")}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger-dark"
        >
          {error}
        </p>
      )}
      {errors.length > 0 && (
        <ul
          role="alert"
          className="flex list-disc flex-col gap-1 rounded-xl bg-danger/10 px-7 py-3 text-sm font-medium text-danger-dark"
        >
          {errors.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("type")}>
          <select
            value={state.type}
            disabled={isEdit}
            onChange={(e) => patch({ type: e.target.value as PuzzleType })}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <option value="spot-bug">{t("typeSpotBug")}</option>
            <option value="fill-modifier">{t("typeFillModifier")}</option>
            <option value="syntax-sort">{t("typeSyntaxSort")}</option>
          </select>
        </Field>
        <Field label={t("difficulty")}>
          <select
            value={state.difficulty}
            onChange={(e) =>
              patch({ difficulty: Number(e.target.value) as 1 | 2 | 3 })
            }
            className={inputClass}
          >
            <option value={1}>{t("diffEasy")}</option>
            <option value={2}>{t("diffMedium")}</option>
            <option value={3}>{t("diffHard")}</option>
          </select>
        </Field>
      </div>

      {isEdit && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-ink">
            {t("scheduledForDay", { n: currentDay ?? 0 })}
          </span>
          <p className="text-xs text-ink-soft">{t("scheduleEditHint")}</p>
        </div>
      )}

      {isEdit && (
        <Field label={t("idLabel")}>
          <input
            value={state.id}
            disabled
            readOnly
            className={`${monoInputClass} disabled:cursor-not-allowed disabled:opacity-60`}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("promptEn")}>
          <input
            value={state.promptEn}
            onChange={(e) => patch({ promptEn: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label={t("promptTh")}>
          <input
            value={state.promptTh}
            onChange={(e) => patch({ promptTh: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      {state.type === "spot-bug" && (
        <SpotBugFields
          codeLinesText={state.codeLinesText}
          buggyLineIndex={state.buggyLineIndex}
          onChange={patch}
        />
      )}
      {state.type === "fill-modifier" && (
        <FillModifierFields
          codeBefore={state.codeBefore}
          codeAfter={state.codeAfter}
          options={state.options}
          correctIndex={state.correctIndex}
          onChange={patch}
        />
      )}
      {state.type === "syntax-sort" && (
        <SyntaxSortFields
          correctLinesText={state.correctLinesText}
          shuffle={state.shuffle}
          onChange={patch}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("explanationEn")}>
          <textarea
            value={state.explanationEn}
            onChange={(e) => patch({ explanationEn: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field label={t("explanationTh")}>
          <textarea
            value={state.explanationTh}
            onChange={(e) => patch({ explanationTh: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-1 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-brand px-6 py-3 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-60"
        >
          {submitting
            ? t(isEdit ? "saving" : "creating")
            : t(isEdit ? "save" : "submit")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl px-6 py-3 text-base font-bold text-ink-soft ring-1 ring-line transition hover:bg-line/40 hover:text-ink active:translate-y-px"
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PuzzleComponentProps } from "./types";
import SubmitButton from "./SubmitButton";

/**
 * multiple-choice: a plain question (rendered as the prompt by GamePage) with 4
 * answer choices; pick one, then submit { correctIndex }.
 */
export default function MultipleChoice({
  puzzle,
  onSubmit,
  disabled,
  submitting,
}: PuzzleComponentProps) {
  const t = useTranslations("Game");
  const [selected, setSelected] = useState<number | null>(null);
  if (puzzle.type !== "multiple-choice") return null;
  const { choices } = puzzle.payload;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("multipleChoice.hint")}</p>
      <div className="flex flex-col gap-2">
        {choices.map((choice, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(i)}
              aria-pressed={isSelected}
              className={`rounded-2xl border-2 px-4 py-3 text-left text-base transition active:translate-y-px disabled:cursor-default
                ${
                  isSelected
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
            >
              {choice}
            </button>
          );
        })}
      </div>
      <SubmitButton
        disabled={disabled || selected === null}
        submitting={submitting}
        onClick={() => selected !== null && onSubmit({ correctIndex: selected })}
      />
    </div>
  );
}

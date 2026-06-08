"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PuzzleComponentProps } from "./types";
import SubmitButton from "./SubmitButton";

/** spot-bug: tap the line that breaks the view, then submit { buggyLineIndex }. */
export default function SpotTheBug({
  puzzle,
  onSubmit,
  disabled,
  submitting,
}: PuzzleComponentProps) {
  const t = useTranslations("Game");
  const [selected, setSelected] = useState<number | null>(null);
  if (puzzle.type !== "spot-bug") return null;
  const lines = puzzle.payload.codeLines;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl bg-code-bg">
        <ol className="w-max min-w-full font-mono text-sm leading-relaxed text-code-fg sm:text-base">
          {lines.map((line, i) => {
            const isSelected = selected === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(i)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-start gap-3 px-3 py-1.5 text-left transition-colors active:bg-brand/40 disabled:cursor-default
                    ${
                      isSelected
                        ? "bg-brand/30 ring-1 ring-inset ring-brand"
                        : "hover:bg-white/5"
                    }`}
                >
                  <span className="select-none pt-0.5 text-xs text-code-fg/40 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="whitespace-pre">{line.length ? line : " "}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-sm text-ink-soft">{t("spotBug.hint")}</p>
      <SubmitButton
        disabled={disabled || selected === null}
        submitting={submitting}
        onClick={() => selected !== null && onSubmit({ buggyLineIndex: selected })}
      />
    </div>
  );
}

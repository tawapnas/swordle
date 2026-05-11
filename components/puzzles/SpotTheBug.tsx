"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PuzzleComponentProps } from "./types";

/** spot-bug: tap the line that breaks the view, then submit { buggyLineIndex }. */
export default function SpotTheBug({
  puzzle,
  onSubmit,
  disabled,
}: PuzzleComponentProps) {
  const t = useTranslations("Game");
  const [selected, setSelected] = useState<number | null>(null);
  if (puzzle.type !== "spot-bug") return null;
  const lines = puzzle.payload.codeLines;

  return (
    <div className="flex flex-col gap-4">
      <ol className="overflow-hidden rounded-2xl bg-code-bg font-mono text-[13px] leading-relaxed text-code-fg sm:text-sm">
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
                <span className="select-none pt-0.5 text-[11px] text-code-fg/40 tabular-nums">
                  {i + 1}
                </span>
                <span className="whitespace-pre">{line.length ? line : " "}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-ink-soft">Tap the line you think is buggy.</p>
      <button
        type="button"
        disabled={disabled || selected === null}
        onClick={() => selected !== null && onSubmit({ buggyLineIndex: selected })}
        className="rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-40"
      >
        {t("submit")}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PuzzleComponentProps } from "./types";
import SubmitButton from "./SubmitButton";

/**
 * fill-modifier: code with a blank between codeBefore / codeAfter; pick the
 * modifier that fills it, then submit { correctIndex }.
 */
export default function FillTheModifier({
  puzzle,
  onSubmit,
  disabled,
  submitting,
}: PuzzleComponentProps) {
  const t = useTranslations("Game");
  const [selected, setSelected] = useState<number | null>(null);
  if (puzzle.type !== "fill-modifier") return null;
  const { codeBefore, codeAfter, options } = puzzle.payload;
  const fill = selected !== null ? options[selected] : "_______";

  return (
    <div className="flex flex-col gap-4">
      <pre className="overflow-x-auto rounded-2xl bg-code-bg px-4 py-3 font-mono text-sm leading-relaxed text-code-fg sm:text-base">
        <code className="whitespace-pre-wrap break-words">
          {codeBefore}
          <span
            className={`px-1.5 py-0.5 font-bold ${
              selected !== null ? "bg-brand/30 text-brand" : "bg-white/10 text-code-fg/50"
            }`}
          >
            {fill}
          </span>
          {codeAfter}
        </code>
      </pre>
      <p className="text-sm text-ink-soft">{t("fillModifier.hint")}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(i)}
              aria-pressed={isSelected}
              className={`rounded-2xl border-2 px-4 py-3 text-left font-mono text-base transition active:translate-y-px disabled:cursor-default
                ${
                  isSelected
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
            >
              .{opt}
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

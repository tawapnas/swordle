"use client";

import { useState } from "react";
import type { PuzzleComponentProps } from "./types";

/**
 * fill-modifier: code with a blank between codeBefore / codeAfter; pick the
 * modifier that fills it, then submit { correctIndex }.
 */
export default function FillTheModifier({
  puzzle,
  onSubmit,
  disabled,
}: PuzzleComponentProps) {
  const [selected, setSelected] = useState<number | null>(null);
  if (puzzle.type !== "fill-modifier") return null;
  const { codeBefore, codeAfter, options } = puzzle.payload;
  const fill = selected !== null ? options[selected] : "_______";

  return (
    <div className="flex flex-col gap-4">
      <pre className="overflow-x-auto rounded-2xl bg-code-bg px-4 py-3 font-mono text-[13px] leading-relaxed text-code-fg sm:text-sm">
        <code className="whitespace-pre-wrap break-words">
          {codeBefore}
          <span
            className={`rounded px-1.5 py-0.5 font-bold ${
              selected !== null ? "bg-accent/30 text-accent" : "bg-white/10 text-code-fg/50"
            }`}
          >
            {fill}
          </span>
          {codeAfter}
        </code>
      </pre>
      <p className="text-sm text-ink-soft">Pick the modifier that fits the blank.</p>
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
              className={`rounded-2xl border-2 px-4 py-3 text-left font-mono text-sm transition active:translate-y-px disabled:cursor-default
                ${
                  isSelected
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-line bg-white text-ink hover:border-brand/40"
                }`}
            >
              .{opt}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled || selected === null}
        onClick={() => selected !== null && onSubmit({ correctIndex: selected })}
        className="rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  );
}

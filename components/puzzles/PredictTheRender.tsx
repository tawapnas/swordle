"use client";

import { useState } from "react";
import CodeBlock from "@/components/CodeBlock";
import type { PuzzleComponentProps } from "./types";

/**
 * predict-render: show SwiftUI code, pick which of 4 SVG mockups it renders,
 * then submit { correctOptionId }.
 *
 * NOTE: option.mockupSvg is trusted seed content authored by the backend, so we
 * render it via dangerouslySetInnerHTML inside a clipped wrapper. If options ever
 * become user-supplied this must be sanitised first.
 */
export default function PredictTheRender({
  puzzle,
  onSubmit,
  disabled,
}: PuzzleComponentProps) {
  const [selected, setSelected] = useState<string | null>(null);
  if (puzzle.type !== "predict-render") return null;
  const { code, options } = puzzle.payload;

  return (
    <div className="flex flex-col gap-4">
      <CodeBlock code={code} />
      <p className="text-sm text-ink-soft">Which screen does this render?</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(opt.id)}
              aria-pressed={isSelected}
              aria-label={`Option ${opt.id.toUpperCase()}`}
              className={`overflow-hidden rounded-2xl border-2 bg-white p-2 transition active:translate-y-px disabled:cursor-default
                ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/30"
                    : "border-line hover:border-brand/40"
                }`}
            >
              <div
                className="aspect-square w-full overflow-hidden rounded-xl bg-sky/10 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: opt.mockupSvg }}
              />
              <span className="mt-1 block text-xs font-bold uppercase text-ink-soft">
                {opt.id}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled || selected === null}
        onClick={() => selected !== null && onSubmit({ correctOptionId: selected })}
        className="rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PuzzleComponentProps } from "./types";

/**
 * syntax-sort: reorder the shuffled lines into a valid view.
 * Interaction (no drag-and-drop lib): tap a line to select it, tap another to
 * swap the two; or use the up/down chevrons to nudge a line. Fully keyboard-
 * operable (buttons + Enter/Space). Submits { correctOrder: number[] } where
 * each element is an index into the original `shuffledLines`.
 */
export default function SyntaxSort({
  puzzle,
  onSubmit,
  disabled,
}: PuzzleComponentProps) {
  const t = useTranslations("Game");
  const tSort = useTranslations("Game.syntaxSort");
  const initial =
    puzzle.type === "syntax-sort"
      ? puzzle.payload.shuffledLines.map((_, i) => i)
      : [];
  // `order[position] = originalIndex`
  const [order, setOrder] = useState<number[]>(initial);
  const [selected, setSelected] = useState<number | null>(null);

  if (puzzle.type !== "syntax-sort") return null;
  const lines = puzzle.payload.shuffledLines;

  function swap(a: number, b: number) {
    if (disabled || a < 0 || b < 0 || a >= order.length || b >= order.length) return;
    setOrder((o) => {
      const next = [...o];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function tapLine(pos: number) {
    if (disabled) return;
    if (selected === null) {
      setSelected(pos);
    } else if (selected === pos) {
      setSelected(null);
    } else {
      swap(selected, pos);
      setSelected(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2">
        {order.map((origIdx, pos) => {
          const isSelected = selected === pos;
          return (
            <li
              key={origIdx}
              className={`flex items-stretch gap-1 rounded-2xl border-2 bg-code-bg transition
                ${isSelected ? "border-brand ring-2 ring-brand/30" : "border-transparent"}`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => tapLine(pos)}
                aria-pressed={isSelected}
                aria-label={
                  isSelected
                    ? tSort("lineSelected", {
                        n: pos + 1,
                        text: lines[origIdx].trim() || tSort("blank"),
                      })
                    : tSort("lineIdle", {
                        n: pos + 1,
                        text: lines[origIdx].trim() || tSort("blank"),
                      })
                }
                className="flex-1 overflow-x-auto px-3 py-2.5 text-left font-mono text-[13px] leading-relaxed text-code-fg active:bg-brand/30 disabled:cursor-default sm:text-sm"
              >
                <span className="whitespace-pre">
                  {lines[origIdx].length ? lines[origIdx] : " "}
                </span>
              </button>
              <div className="flex flex-col justify-center gap-0.5 pr-1.5">
                <button
                  type="button"
                  disabled={disabled || pos === 0}
                  onClick={() => swap(pos, pos - 1)}
                  aria-label={tSort("moveUp", { n: pos + 1 })}
                  className="rounded-lg p-1 text-code-fg/60 transition hover:bg-white/10 hover:text-code-fg active:translate-y-px disabled:opacity-25"
                >
                  <ChevronUp size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={disabled || pos === order.length - 1}
                  onClick={() => swap(pos, pos + 1)}
                  aria-label={tSort("moveDown", { n: pos + 1 })}
                  className="rounded-lg p-1 text-code-fg/60 transition hover:bg-white/10 hover:text-code-fg active:translate-y-px disabled:opacity-25"
                >
                  <ChevronDown size={18} aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-ink-soft">{tSort("hint")}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit({ correctOrder: order })}
        className="rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-40"
      >
        {t("submit")}
      </button>
    </div>
  );
}

"use client";

// Syntax-sort fields: admin types the lines in their CORRECT order; the cached
// `shuffle` (what players see + the answer key) is regenerated on every text
// change so it can never describe stale text. A re-shuffle button re-rolls it.

import { useTranslations } from "next-intl";
import { buildShuffle, toLines } from "@/lib/puzzle-form";
import { Field, monoInputClass } from "./styles";

export default function SyntaxSortFields({
  correctLinesText,
  shuffle,
  onChange,
}: {
  correctLinesText: string;
  shuffle: { shuffledLines: string[]; correctOrder: number[] } | null;
  onChange: (patch: {
    correctLinesText?: string;
    shuffle?: { shuffledLines: string[]; correctOrder: number[] } | null;
  }) => void;
}) {
  const t = useTranslations("Admin.puzzles");

  function regenerate(text: string) {
    const lines = text.trim() === "" ? [] : toLines(text);
    onChange({
      correctLinesText: text,
      shuffle: lines.length === 0 ? null : buildShuffle(lines),
    });
  }

  function reshuffle() {
    const lines = correctLinesText.trim() === "" ? [] : toLines(correctLinesText);
    onChange({ shuffle: lines.length === 0 ? null : buildShuffle(lines) });
  }

  const shuffledLines = shuffle?.shuffledLines ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Field label={t("correctLines")}>
        <textarea
          value={correctLinesText}
          onChange={(e) => regenerate(e.target.value)}
          rows={6}
          className={monoInputClass}
          spellCheck={false}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-ink">{t("shufflePreview")}</span>
          <button
            type="button"
            onClick={reshuffle}
            disabled={shuffledLines.length === 0}
            className="rounded-xl px-3 py-1.5 text-xs font-bold text-brand-dark transition hover:bg-brand/10 active:translate-y-px disabled:opacity-40"
          >
            🔀 {t("reshuffle")}
          </button>
        </div>
        {shuffledLines.length === 0 ? (
          <p className="rounded-2xl bg-card px-4 py-3 text-sm text-ink-soft ring-1 ring-line">
            {t("correctLines")}
          </p>
        ) : (
          <ol className="flex flex-col gap-1 rounded-2xl bg-card p-2 ring-1 ring-line">
            {shuffledLines.map((line, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
              >
                <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-ink-soft">
                  {i}
                </span>
                <code className="min-w-0 flex-1 truncate font-mono text-sm text-ink">
                  {line === "" ? " " : line}
                </code>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

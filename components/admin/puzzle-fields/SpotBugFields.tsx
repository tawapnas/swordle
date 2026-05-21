"use client";

// Spot-the-bug fields: one mono textarea of code, then a numbered list of those
// lines with a radio per line marking the buggy one. The `buggyLineIndex` is
// clamped whenever the line count changes.

import { useTranslations } from "next-intl";
import { toLines } from "@/lib/puzzle-form";
import { Field, monoInputClass } from "./styles";

export default function SpotBugFields({
  codeLinesText,
  buggyLineIndex,
  onChange,
}: {
  codeLinesText: string;
  buggyLineIndex: number | null;
  onChange: (patch: { codeLinesText?: string; buggyLineIndex?: number | null }) => void;
}) {
  const t = useTranslations("Admin.puzzles");
  const lines = codeLinesText.trim() === "" ? [] : toLines(codeLinesText);

  function handleText(text: string) {
    const next = text.trim() === "" ? [] : toLines(text);
    // Clamp the selected line to the new line count.
    const clamped =
      buggyLineIndex != null && buggyLineIndex < next.length ? buggyLineIndex : null;
    onChange({ codeLinesText: text, buggyLineIndex: clamped });
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label={t("codeLines")}>
        <textarea
          value={codeLinesText}
          onChange={(e) => handleText(e.target.value)}
          rows={6}
          className={monoInputClass}
          spellCheck={false}
        />
      </Field>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-bold text-ink">
          {t("buggyLineLabel")}
        </legend>
        {lines.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-3 text-sm text-ink-soft ring-1 ring-line">
            {t("codeLines")}
          </p>
        ) : (
          <ol className="flex flex-col gap-1 rounded-2xl bg-card p-2 ring-1 ring-line">
            {lines.map((line, i) => {
              const checked = buggyLineIndex === i;
              return (
                <li key={i}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition ${
                      checked ? "bg-danger/10 ring-1 ring-danger/40" : "hover:bg-line/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="buggy-line"
                      checked={checked}
                      onChange={() => onChange({ buggyLineIndex: i })}
                      className="size-4 accent-danger focus-visible:outline-2 focus-visible:outline-brand"
                    />
                    <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-ink-soft">
                      {i}
                    </span>
                    <code className="min-w-0 flex-1 truncate font-mono text-sm text-ink">
                      {line === "" ? " " : line}
                    </code>
                  </label>
                </li>
              );
            })}
          </ol>
        )}
      </fieldset>
    </div>
  );
}

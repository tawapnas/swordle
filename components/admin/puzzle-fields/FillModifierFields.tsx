"use client";

// Fill-the-modifier fields: code before/after the blank, then exactly 4 option
// inputs each with a radio marking the correct one.

import { useTranslations } from "next-intl";
import { Field, inputClass, monoInputClass } from "./styles";

export default function FillModifierFields({
  codeBefore,
  codeAfter,
  options,
  correctIndex,
  onChange,
}: {
  codeBefore: string;
  codeAfter: string;
  options: string[];
  correctIndex: number | null;
  onChange: (patch: {
    codeBefore?: string;
    codeAfter?: string;
    options?: string[];
    correctIndex?: number | null;
  }) => void;
}) {
  const t = useTranslations("Admin.puzzles");

  function setOption(i: number, value: string) {
    const next = [...options];
    next[i] = value;
    onChange({ options: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("codeBefore")}>
          <textarea
            value={codeBefore}
            onChange={(e) => onChange({ codeBefore: e.target.value })}
            rows={3}
            className={monoInputClass}
            spellCheck={false}
          />
        </Field>
        <Field label={t("codeAfter")}>
          <textarea
            value={codeAfter}
            onChange={(e) => onChange({ codeAfter: e.target.value })}
            rows={3}
            className={monoInputClass}
            spellCheck={false}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold text-ink">
          {t("correctOption")}
        </legend>
        {options.map((opt, i) => {
          const checked = correctIndex === i;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition ${
                checked ? "bg-brand/10 ring-1 ring-brand/40" : "ring-1 ring-line"
              }`}
            >
              <input
                type="radio"
                name="correct-option"
                checked={checked}
                onChange={() => onChange({ correctIndex: i })}
                aria-label={t("correctOption")}
                className="size-4 shrink-0 accent-brand focus-visible:outline-2 focus-visible:outline-brand"
              />
              <input
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={t("option", { n: i + 1 })}
                aria-label={t("option", { n: i + 1 })}
                className={`${inputClass} min-w-0 flex-1`}
                spellCheck={false}
              />
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}

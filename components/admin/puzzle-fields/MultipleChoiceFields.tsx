"use client";

// Multiple-choice fields: exactly 4 choices, each with an English and a Thai
// input, plus a radio marking the correct one.

import { useTranslations } from "next-intl";
import { inputClass } from "./styles";

export default function MultipleChoiceFields({
  choicesEn,
  choicesTh,
  correctIndex,
  onChange,
}: {
  choicesEn: string[];
  choicesTh: string[];
  correctIndex: number | null;
  onChange: (patch: {
    choicesEn?: string[];
    choicesTh?: string[];
    correctIndex?: number | null;
  }) => void;
}) {
  const t = useTranslations("Admin.puzzles");

  function setChoice(locale: "en" | "th", i: number, value: string) {
    const key = locale === "en" ? "choicesEn" : "choicesTh";
    const next = [...(locale === "en" ? choicesEn : choicesTh)];
    next[i] = value;
    onChange({ [key]: next });
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-bold text-ink">
        {t("correctChoice")}
      </legend>
      {[0, 1, 2, 3].map((i) => {
        const checked = correctIndex === i;
        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 transition ${
              checked ? "bg-brand/10 ring-1 ring-brand/40" : "ring-1 ring-line"
            }`}
          >
            <input
              type="radio"
              name="correct-choice"
              checked={checked}
              onChange={() => onChange({ correctIndex: i })}
              aria-label={t("correctChoice")}
              className="mt-3 size-4 shrink-0 accent-brand focus-visible:outline-2 focus-visible:outline-brand"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                value={choicesEn[i] ?? ""}
                onChange={(e) => setChoice("en", i, e.target.value)}
                placeholder={t("choiceEn", { n: i + 1 })}
                aria-label={t("choiceEn", { n: i + 1 })}
                className={`${inputClass} min-w-0`}
              />
              <input
                value={choicesTh[i] ?? ""}
                onChange={(e) => setChoice("th", i, e.target.value)}
                placeholder={t("choiceTh", { n: i + 1 })}
                aria-label={t("choiceTh", { n: i + 1 })}
                className={`${inputClass} min-w-0`}
              />
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}

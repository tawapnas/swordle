"use client";

// /admin → "Puzzles": create a puzzle of any type, and list / delete existing
// ones. Mirrors OnboardingForm's pattern (useState + fetch + router.refresh).
// The server (POST /api/admin/puzzles → parsePuzzleInput) is the source of
// truth for validation; this form sends a best-effort object and surfaces any
// errors it gets back.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Puzzle, PuzzleType } from "@/lib/types";

const inputClass =
  "rounded-2xl bg-card px-4 py-3 text-base text-ink shadow-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";
const monoInputClass = `${inputClass} font-mono text-sm`;

/** Split a textarea value into lines, dropping a single trailing blank line. */
function toLines(text: string): string[] {
  return text.replace(/\n+$/, "").split("\n");
}

export default function PuzzleManager({
  puzzles,
  configured,
}: {
  puzzles: Puzzle[];
  configured: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("Admin.puzzles");

  const [type, setType] = useState<PuzzleType>("spot-bug");
  const [id, setId] = useState("");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const [promptEn, setPromptEn] = useState("");
  const [promptTh, setPromptTh] = useState("");
  const [explanationEn, setExplanationEn] = useState("");
  const [explanationTh, setExplanationTh] = useState("");

  // spot-bug
  const [codeLinesText, setCodeLinesText] = useState("");
  const [buggyLineIndex, setBuggyLineIndex] = useState("0");
  // fill-modifier
  const [codeBefore, setCodeBefore] = useState("");
  const [codeAfter, setCodeAfter] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [correctIndex, setCorrectIndex] = useState("0");
  // syntax-sort
  const [shuffledLinesText, setShuffledLinesText] = useState("");
  const [correctOrderText, setCorrectOrderText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  function resetTypeFields() {
    setCodeLinesText("");
    setBuggyLineIndex("0");
    setCodeBefore("");
    setCodeAfter("");
    setOptionsText("");
    setCorrectIndex("0");
    setShuffledLinesText("");
    setCorrectOrderText("");
  }

  function buildPuzzle(): Record<string, unknown> {
    const base = {
      ...(id.trim() ? { id: id.trim() } : {}),
      type,
      difficulty,
      prompt: { en: promptEn.trim(), th: promptTh.trim() },
      explanation: { en: explanationEn.trim(), th: explanationTh.trim() },
    };
    if (type === "spot-bug") {
      return {
        ...base,
        payload: { codeLines: toLines(codeLinesText) },
        answer: { buggyLineIndex: Number(buggyLineIndex) },
      };
    }
    if (type === "fill-modifier") {
      return {
        ...base,
        payload: { codeBefore, codeAfter, options: toLines(optionsText) },
        answer: { correctIndex: Number(correctIndex) },
      };
    }
    return {
      ...base,
      payload: { shuffledLines: toLines(shuffledLinesText) },
      answer: {
        correctOrder: correctOrderText
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !Number.isNaN(n)),
      },
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setErrors([]);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPuzzle()),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          errors?: string[];
        };
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setErrors(data.errors);
        } else {
          setError(data.error ?? t("createFailed"));
        }
        setSubmitting(false);
        return;
      }
      // Reset and refresh so the new puzzle appears in the list below.
      setId("");
      setPromptEn("");
      setPromptTh("");
      setExplanationEn("");
      setExplanationTh("");
      resetTypeFields();
      setSuccess(true);
      setSubmitting(false);
      router.refresh();
    } catch {
      setError(t("createFailed"));
      setSubmitting(false);
    }
  }

  async function handleDelete(puzzleId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/admin/puzzles?id=${encodeURIComponent(puzzleId)}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } catch {
      /* no-op — refresh on next load */
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-black text-ink">{t("title")}</h2>

      {!configured ? (
        <p className="rounded-2xl bg-card px-5 py-4 text-sm text-ink ring-1 ring-line">
          {t("unconfigured")}
        </p>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl bg-card px-5 py-5 ring-1 ring-line"
          >
            <h3 className="text-sm font-black text-ink">{t("create")}</h3>

            {success && (
              <p className="rounded-xl bg-brand/10 px-4 py-3 text-sm font-medium text-brand-dark">
                {t("created")}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger-dark"
              >
                {error}
              </p>
            )}
            {errors.length > 0 && (
              <ul
                role="alert"
                className="flex list-disc flex-col gap-1 rounded-xl bg-danger/10 px-7 py-3 text-sm font-medium text-danger-dark"
              >
                {errors.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("type")}>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as PuzzleType);
                    resetTypeFields();
                  }}
                  className={inputClass}
                >
                  <option value="spot-bug">{t("typeSpotBug")}</option>
                  <option value="fill-modifier">{t("typeFillModifier")}</option>
                  <option value="syntax-sort">{t("typeSyntaxSort")}</option>
                </select>
              </Field>
              <Field label={t("difficulty")}>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
                  className={inputClass}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </Field>
            </div>

            <Field label={t("idLabel")}>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={`${type}-…`}
                className={monoInputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("promptEn")}>
                <input value={promptEn} onChange={(e) => setPromptEn(e.target.value)} className={inputClass} />
              </Field>
              <Field label={t("promptTh")}>
                <input value={promptTh} onChange={(e) => setPromptTh(e.target.value)} className={inputClass} />
              </Field>
            </div>

            {type === "spot-bug" && (
              <>
                <Field label={t("codeLines")}>
                  <textarea
                    value={codeLinesText}
                    onChange={(e) => setCodeLinesText(e.target.value)}
                    rows={6}
                    className={monoInputClass}
                  />
                </Field>
                <Field label={t("buggyLineIndex")}>
                  <input
                    type="number"
                    min={0}
                    value={buggyLineIndex}
                    onChange={(e) => setBuggyLineIndex(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            {type === "fill-modifier" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t("codeBefore")}>
                    <textarea
                      value={codeBefore}
                      onChange={(e) => setCodeBefore(e.target.value)}
                      rows={3}
                      className={monoInputClass}
                    />
                  </Field>
                  <Field label={t("codeAfter")}>
                    <textarea
                      value={codeAfter}
                      onChange={(e) => setCodeAfter(e.target.value)}
                      rows={3}
                      className={monoInputClass}
                    />
                  </Field>
                </div>
                <Field label={t("options")}>
                  <textarea
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    rows={4}
                    className={monoInputClass}
                  />
                </Field>
                <Field label={t("correctIndex")}>
                  <select
                    value={correctIndex}
                    onChange={(e) => setCorrectIndex(e.target.value)}
                    className={inputClass}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </Field>
              </>
            )}

            {type === "syntax-sort" && (
              <>
                <Field label={t("shuffledLines")}>
                  <textarea
                    value={shuffledLinesText}
                    onChange={(e) => setShuffledLinesText(e.target.value)}
                    rows={6}
                    className={monoInputClass}
                  />
                </Field>
                <Field label={t("correctOrder")}>
                  <input
                    value={correctOrderText}
                    onChange={(e) => setCorrectOrderText(e.target.value)}
                    placeholder="2,0,1,3"
                    className={monoInputClass}
                  />
                </Field>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("explanationEn")}>
                <textarea
                  value={explanationEn}
                  onChange={(e) => setExplanationEn(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </Field>
              <Field label={t("explanationTh")}>
                <textarea
                  value={explanationTh}
                  onChange={(e) => setExplanationTh(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 self-start rounded-2xl bg-brand px-6 py-3 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? t("creating") : t("submit")}
            </button>
          </form>

          <div className="flex flex-col gap-2 rounded-2xl bg-card px-5 py-5 ring-1 ring-line">
            <h3 className="text-sm font-black text-ink">{t("listTitle")}</h3>
            {puzzles.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-soft">{t("listEmpty")}</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-ink-soft">
                    <th className="py-1 pr-2 font-medium">ID</th>
                    <th className="py-1 pr-2 font-medium">Type</th>
                    <th className="py-1 pr-2 font-medium">Diff</th>
                    <th className="py-1 pr-2 font-medium">Prompt</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody>
                  {puzzles.map((p) => (
                    <tr key={p.id} className="border-t border-line align-top">
                      <td className="py-1.5 pr-2 font-mono text-xs break-all">{p.id}</td>
                      <td className="py-1.5 pr-2">{p.type}</td>
                      <td className="py-1.5 pr-2">{p.difficulty}</td>
                      <td className="py-1.5 pr-2 text-ink-soft">{p.prompt.en}</td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-danger-dark transition hover:bg-danger/10"
                        >
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}

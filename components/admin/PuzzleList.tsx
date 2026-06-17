"use client";

// The puzzle schedule: a day-by-day timeline (one card per puzzle, day number =
// index + 1) shown LATEST DAY FIRST, with per-card Edit / Delete and
// move-earlier / move-later controls. Searching collapses the timeline into a
// flat filtered list with no day headers or reordering. Delete keeps the
// confirm() + DELETE fetch.

import { useMemo, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Puzzle } from "@/lib/types";
import { dateForDayNumber } from "@/lib/daily";
import { inputClass } from "./puzzle-fields/styles";

const TYPE_META: Record<Puzzle["type"], { emoji: string; labelKey: string }> = {
  "spot-bug": { emoji: "🐛", labelKey: "typeSpotBug" },
  "fill-modifier": { emoji: "✏️", labelKey: "typeFillModifier" },
  "multiple-choice": { emoji: "❓", labelKey: "typeMultipleChoice" },
};

const DIFF_KEYS = ["diffEasy", "diffMedium", "diffHard"] as const;

export default function PuzzleList({
  puzzles,
  todayDayNumber,
  reorderError,
  onNew,
  onEdit,
  onDeleted,
  onReorder,
}: {
  puzzles: Puzzle[];
  todayDayNumber: number;
  reorderError?: string | null;
  onNew: () => void;
  onEdit: (puzzle: Puzzle) => void;
  onDeleted: () => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const t = useTranslations("Admin.puzzles");
  const format = useFormatter();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return puzzles;
    return puzzles.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.prompt.en.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q),
    );
  }, [puzzles, q]);

  async function handleDelete(puzzleId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(
        `/api/admin/puzzles?id=${encodeURIComponent(puzzleId)}`,
        { method: "DELETE" },
      );
      if (res.ok) onDeleted();
    } catch {
      /* no-op — refresh on next load */
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= puzzles.length) return;
    const ids = puzzles.map((p) => p.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onReorder(ids);
  }

  function typeLabel(type: Puzzle["type"]) {
    const meta = TYPE_META[type];
    return `${meta.emoji} ${t(meta.labelKey)}`;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card px-5 py-5 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-black text-ink">{t("timelineTitle")}</h3>
        <button
          type="button"
          onClick={onNew}
          className="rounded-2xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark"
        >
          + {t("new")}
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search")}
        aria-label={t("search")}
        className={inputClass}
      />

      {reorderError && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger-dark"
        >
          {reorderError}
        </p>
      )}

      {puzzles.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">{t("listEmpty")}</p>
      ) : q ? (
        filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">
            {t("noMatches")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-ink-soft">{t("reorderHint")}</p>
            <ul className="flex flex-col gap-2">
              {[...filtered].reverse().map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card px-3 py-2.5 ring-1 ring-line"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-bold text-ink">
                      {typeLabel(p.type)}
                    </span>
                    <span className="truncate text-xs text-ink-soft">
                      {p.prompt.en}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-brand-dark transition hover:bg-brand/10"
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-danger-dark transition hover:bg-danger/10"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <ol className="flex flex-col gap-3">
          {puzzles
            .map((p, scheduleIndex) => ({ puzzle: p, scheduleIndex }))
            .reverse()
            .map(({ puzzle: p, scheduleIndex }) => {
            const dayNumber = scheduleIndex + 1;
            const isToday = dayNumber === todayDayNumber;
            const date = format.dateTime(dateForDayNumber(dayNumber), {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return (
              <li
                key={p.id}
                className={`flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 ring-1 ${
                  isToday ? "ring-2 ring-brand" : "ring-line"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-ink">
                      {t("dayLabel", { n: dayNumber })}
                      <span className="font-bold text-ink-soft"> · {date}</span>
                    </h4>
                    {isToday && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
                        {t("today")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(scheduleIndex, 1)}
                      disabled={scheduleIndex === puzzles.length - 1}
                      aria-label={t("moveLater")}
                      title={t("moveLater")}
                      className="rounded-lg p-1.5 text-ink-soft transition hover:bg-line/40 hover:text-ink active:translate-y-px disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(scheduleIndex, -1)}
                      disabled={scheduleIndex === 0}
                      aria-label={t("moveEarlier")}
                      title={t("moveEarlier")}
                      className="rounded-lg p-1.5 text-ink-soft transition hover:bg-line/40 hover:text-ink active:translate-y-px disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">
                      {typeLabel(p.type)}
                    </span>
                    <span className="rounded-full bg-line/50 px-2 py-0.5 text-xs font-bold text-ink-soft">
                      {t(DIFF_KEYS[p.difficulty - 1])}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">{p.prompt.en}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-brand-dark transition hover:bg-brand/10"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-danger-dark transition hover:bg-danger/10"
                  >
                    {t("delete")}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

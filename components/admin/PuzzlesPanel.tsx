"use client";

// The "Puzzles" tab body: switches between the puzzle timeline and the
// create/edit form. After a successful create/edit/delete/reorder it refreshes
// the route (so the server-rendered puzzle list reloads) and returns to list
// mode.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Puzzle } from "@/lib/types";
import PuzzleList from "./PuzzleList";
import PuzzleForm from "./PuzzleForm";

type View =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; puzzle: Puzzle };

export default function PuzzlesPanel({
  puzzles,
  configured,
  todayDayNumber,
}: {
  puzzles: Puzzle[];
  configured: boolean;
  todayDayNumber: number;
}) {
  const t = useTranslations("Admin.puzzles");
  const router = useRouter();
  const [view, setView] = useState<View>({ mode: "list" });
  const [reorderError, setReorderError] = useState<string | null>(null);

  if (!configured) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-black text-ink">{t("title")}</h2>
        <p className="rounded-2xl bg-card px-5 py-4 text-sm text-ink ring-1 ring-line">
          {t("unconfigured")}
        </p>
      </section>
    );
  }

  function handleDone() {
    setView({ mode: "list" });
    router.refresh();
  }

  async function handleReorder(orderedIds: string[]) {
    setReorderError(null);
    try {
      const res = await fetch("/api/admin/puzzles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderedIds }),
      });
      if (!res.ok) {
        setReorderError(t("reorderFailed"));
        return;
      }
      router.refresh();
    } catch {
      setReorderError(t("reorderFailed"));
    }
  }

  const currentDay =
    view.mode === "edit"
      ? puzzles.findIndex((p) => p.id === view.puzzle.id) + 1
      : undefined;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-black text-ink">{t("title")}</h2>

      {view.mode === "list" ? (
        <PuzzleList
          puzzles={puzzles}
          todayDayNumber={todayDayNumber}
          reorderError={reorderError}
          onNew={() => setView({ mode: "create" })}
          onEdit={(puzzle) => setView({ mode: "edit", puzzle })}
          onDeleted={() => router.refresh()}
          onReorder={handleReorder}
        />
      ) : (
        <PuzzleForm
          initial={view.mode === "edit" ? view.puzzle : undefined}
          currentDay={currentDay}
          onDone={handleDone}
          onCancel={() => setView({ mode: "list" })}
        />
      )}
    </section>
  );
}

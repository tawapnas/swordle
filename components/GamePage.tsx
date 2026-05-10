"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicPuzzle, TodayResponse } from "@/lib/types";
import type { MeResponse, ValidateResultWithAccount } from "@/lib/account";
import { readState, recordResult, type GameResult } from "@/lib/streak";
import {
  decideInitialPhase,
  fetchMe,
  maybeImport,
  streaksFromState,
  type Streaks,
} from "@/lib/gameSession";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import Timer from "./Timer";
import AccountBar from "./AccountBar";
import PuzzleRenderer from "./puzzles/PuzzleRenderer";
import ResultScreen from "./ResultScreen";
import AlreadyPlayed from "./AlreadyPlayed";

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "already"; result: GameResult; timeMs: number; dayNumber: number; streaks: Streaks }
  | { kind: "playing"; puzzle: PublicPuzzle; dayNumber: number }
  | {
      kind: "result";
      dayNumber: number;
      result: GameResult;
      explanation: string;
      timeMs: number;
      streaks: Streaks;
    };

export default function GamePage() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  /** True once we know the player is signed in (server-backed). */
  const [signedIn, setSignedIn] = useState(false);
  const startedAtRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const pendingAnswerRef = useRef<unknown>(null);

  // Mount: fetch today's puzzle + (if a session exists) the server account,
  // import legacy localStorage progress once, then decide the phase.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/puzzle/today", { cache: "no-store" });
        if (!res.ok) throw new Error(`today returned ${res.status}`);
        const today = (await res.json()) as TodayResponse;
        const me = await loadAccount();
        if (cancelled) return;
        setSignedIn(me !== null);
        const next = decideInitialPhase(today, me, readState());
        if (next.kind === "playing") {
          startedAtRef.current = Date.now();
          setPhase({ kind: "playing", puzzle: today.puzzle, dayNumber: next.dayNumber });
        } else {
          setPhase(next);
        }
      } catch (e) {
        if (cancelled) return;
        setPhase({
          kind: "error",
          message: e instanceof Error ? e.message : "Failed to load today's puzzle.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(
    async (puzzle: PublicPuzzle, dayNumber: number, answer: unknown) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      const timeMs = Date.now() - startedAtRef.current;
      const { data, explanation } = await submitAnswer(puzzle.id, answer, timeMs);
      const result: GameResult = (data?.correct ?? false) ? "solved" : "failed";

      // Signed-in path: trust the server's streak / alreadyPlayed.
      if (
        data &&
        (data.currentStreak !== undefined ||
          data.longestStreak !== undefined ||
          data.alreadyPlayed !== undefined)
      ) {
        const streaks: Streaks = {
          currentStreak: data.currentStreak ?? 0,
          longestStreak: data.longestStreak ?? 0,
          fromServer: true,
        };
        setPhase(
          data.alreadyPlayed
            ? { kind: "already", dayNumber, result, timeMs, streaks }
            : { kind: "result", dayNumber, result, explanation, timeMs, streaks },
        );
        return;
      }

      // Signed-out path: localStorage exactly as before.
      const state = recordResult(dayNumber, result, timeMs);
      setPhase({
        kind: "result",
        dayNumber,
        result,
        explanation,
        timeMs,
        streaks: streaksFromState(state),
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    (answer: unknown) => {
      if (phase.kind !== "playing") return;
      pendingAnswerRef.current = answer;
      void finish(phase.puzzle, phase.dayNumber, answer);
    },
    [phase, finish],
  );

  const handleExpire = useCallback(() => {
    if (phase.kind !== "playing") return;
    void finish(phase.puzzle, phase.dayNumber, pendingAnswerRef.current ?? null);
  }, [phase, finish]);

  const headerDay =
    phase.kind === "playing" || phase.kind === "result" || phase.kind === "already"
      ? phase.dayNumber
      : null;
  const showCta = (s: Streaks) => !s.fromServer && !signedIn;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h1 className="text-xl font-black text-brand sm:text-2xl">
          Swordle
          {headerDay !== null && <span className="ml-2 text-ink-soft">#{headerDay}</span>}
        </h1>
        <div className="flex items-center gap-3">
          <AccountBar />
          {phase.kind === "playing" && <Timer running onExpire={handleExpire} />}
        </div>
      </header>

      {phase.kind === "loading" && (
        <p className="mt-10 text-center text-ink-soft">Loading today&apos;s puzzle…</p>
      )}

      {phase.kind === "error" && (
        <div className="mt-10 rounded-2xl bg-card px-5 py-4 text-center text-sm text-ink ring-1 ring-line">
          <p className="font-bold">Couldn&apos;t load the puzzle</p>
          <p className="mt-1 text-ink-soft">{phase.message}</p>
        </div>
      )}

      {phase.kind === "playing" && (
        <section className="flex flex-col gap-4">
          <p className="text-lg font-bold text-ink">{phase.puzzle.prompt}</p>
          <PuzzleRenderer puzzle={phase.puzzle} onSubmit={handleSubmit} disabled={false} />
        </section>
      )}

      {phase.kind === "result" && (
        <div className="flex flex-1 items-start justify-center pt-2">
          <ResultScreen
            dayNumber={phase.dayNumber}
            result={phase.result}
            timeMs={phase.timeMs}
            currentStreak={phase.streaks.currentStreak}
            longestStreak={phase.streaks.longestStreak}
            explanation={phase.explanation}
            showSignInCta={showCta(phase.streaks)}
          />
        </div>
      )}

      {phase.kind === "already" && (
        <div className="flex flex-1 items-start justify-center pt-2">
          <AlreadyPlayed
            dayNumber={phase.dayNumber}
            result={phase.result}
            timeMs={phase.timeMs}
            currentStreak={phase.streaks.currentStreak}
            longestStreak={phase.streaks.longestStreak}
            showSignInCta={showCta(phase.streaks)}
          />
        </div>
      )}
    </main>
  );
}

/** Get the server account if the player has a Supabase session; import once. */
async function loadAccount(): Promise<MeResponse | null> {
  if (!isSupabaseConfigured()) return null;
  const {
    data: { user },
  } = await createSupabaseBrowserClient().auth.getUser();
  if (!user) return null;
  let me = await fetchMe();
  const local = readState();
  if (me && local) {
    await maybeImport(me, local);
    const refreshed = await fetchMe();
    if (refreshed) me = refreshed;
  }
  return me;
}

async function submitAnswer(
  id: string,
  answer: unknown,
  timeMs: number,
): Promise<{ data: ValidateResultWithAccount | null; explanation: string }> {
  try {
    const res = await fetch("/api/puzzle/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, answer, timeMs }),
    });
    if (res.ok) {
      const data = (await res.json()) as ValidateResultWithAccount;
      return { data, explanation: data.explanation ?? "" };
    }
  } catch {
    /* fall through */
  }
  return { data: null, explanation: "We couldn't reach the scorer — counted as a miss." };
}

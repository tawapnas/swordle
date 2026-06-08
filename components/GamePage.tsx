"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { PublicPuzzle, TodayResponse } from "@/lib/types";
import type { MeResponse, ValidateResultWithAccount } from "@/lib/account";
import { readState, recordResult, type GameResult } from "@/lib/streak";
import {
  decideInitialPhase,
  fetchMe,
  streaksFromState,
  type Streaks,
} from "@/lib/gameSession";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import Timer from "./Timer";
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
      /** Signed CDN URL for the swift reward (fresh server-recorded solve). */
      birdUrl?: string;
    };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Longest we'll wait on the reward image before showing the win screen anyway. */
const BIRD_PRELOAD_CAP_MS = 1000;

export default function GamePage() {
  const t = useTranslations("Game");
  const tBrand = useTranslations("Brand");
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  /** True once we know the player is signed in (server-backed). */
  const [signedIn, setSignedIn] = useState(false);
  /** True while the submitted answer is being scored — drives the button spinner. */
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const pendingAnswerRef = useRef<unknown>(null);

  // Dev-only `?date=YYYY-MM-DD` override — lets devs preview any specific day's
  // puzzle without editing data/puzzles.json. The API gates the param on
  // NODE_ENV !== "production", so it's a no-op in deployed/production builds.
  // Note: validate still records attempts under the *real* today's day_number;
  // clear `attempts` if you want a clean record after exploring.
  const searchParams = useSearchParams();
  const rawDate = searchParams.get("date");
  const previewDate = rawDate && DATE_RE.test(rawDate) ? rawDate : null;

  // Mount (or when ?date= changes): fetch the right puzzle + (if a session
  // exists) the server account, import legacy localStorage progress once,
  // then decide the phase.
  useEffect(() => {
    let cancelled = false;
    // Reset per-puzzle state so a ?date= change starts a fresh attempt.
    submittedRef.current = false;
    pendingAnswerRef.current = null;
    const todayUrl = previewDate
      ? `/api/puzzle/today?date=${previewDate}`
      : "/api/puzzle/today";
    (async () => {
      try {
        const res = await fetch(todayUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`today returned ${res.status}`);
        const today = (await res.json()) as TodayResponse;
        const me = await loadAccount();
        if (cancelled) return;
        // Fresh puzzle loaded → clear any leftover submitting state.
        setSubmitting(false);
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
  }, [previewDate]);

  const finish = useCallback(
    async (puzzle: PublicPuzzle, dayNumber: number, answer: unknown) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      const timeMs = Date.now() - startedAtRef.current;
      const { data, explanation } = await submitAnswer(
        puzzle.id,
        answer,
        timeMs,
        t("scorerUnreachable"),
      );
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
        if (data.alreadyPlayed) {
          setPhase({ kind: "already", dayNumber, result, timeMs, streaks });
        } else {
          // Decode the reward image before revealing the win screen so the
          // swift appears instantly rather than popping in a beat late. Capped
          // so a slow image never holds the result back for long.
          if (result === "solved" && data.birdUrl) {
            await preloadImage(data.birdUrl, BIRD_PRELOAD_CAP_MS);
          }
          setPhase({
            kind: "result",
            dayNumber,
            result,
            explanation,
            timeMs,
            streaks,
            birdUrl: data.birdUrl,
          });
        }
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
    [t],
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
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-ink pb-3">
        <h1 className="font-serif text-3xl text-ink sm:text-4xl">
          {tBrand("name")}
          {headerDay !== null && (
            <span className="ml-2 text-2xl text-ink sm:text-3xl">
              {tBrand("dayLabel", { day: headerDay })}
            </span>
          )}
        </h1>
        {phase.kind === "playing" && <Timer running onExpire={handleExpire} />}
      </header>

      {previewDate && process.env.NODE_ENV !== "production" && (
        <div className="border-l-2 border-brand bg-brand/10 px-3 py-2 text-xs font-bold text-brand">
          {t("devPreview", { date: previewDate })}
        </div>
      )}

      {phase.kind === "loading" && (
        <p className="mt-10 text-center text-ink-soft">{t("loading")}</p>
      )}

      {phase.kind === "error" && (
        <div className="mt-10 border border-line bg-white px-5 py-4 text-center text-sm text-ink">
          <p className="font-bold">{t("errorTitle")}</p>
          <p className="mt-1 text-ink-soft">{phase.message}</p>
        </div>
      )}

      {phase.kind === "playing" && (
        <section className="flex flex-col gap-4">
          <p className="text-xl font-bold text-ink">{phase.puzzle.prompt}</p>
          <PuzzleRenderer
            puzzle={phase.puzzle}
            onSubmit={handleSubmit}
            disabled={submitting}
            submitting={submitting}
          />
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
            claimable={phase.streaks.fromServer}
            birdUrl={phase.birdUrl}
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

/**
 * Warm the browser cache for the reward image: resolves once it's decoded and
 * paint-ready, or after `capMs` — whichever comes first, so a slow/failed image
 * never blocks the win screen. SwiftCatch then renders the same URL from cache.
 */
function preloadImage(src: string, capMs: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const img = new window.Image();
    img.onload = done;
    img.onerror = done;
    img.src = src;
    // decode() resolves only when the bitmap is ready to paint; ignore rejection
    // and let onload / the cap settle it instead.
    img.decode?.().then(done, () => {});
    window.setTimeout(done, capMs);
  });
}

/** Get the server account if the player has a Supabase session. */
async function loadAccount(): Promise<MeResponse | null> {
  if (!isSupabaseConfigured()) return null;
  const {
    data: { user },
  } = await createSupabaseBrowserClient().auth.getUser();
  if (!user) return null;
  return fetchMe();
}

async function submitAnswer(
  id: string,
  answer: unknown,
  timeMs: number,
  fallbackExplanation: string,
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
  return { data: null, explanation: fallbackExplanation };
}

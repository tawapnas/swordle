// Shared types for the account / persistence layer (the API contract between the
// new auth-aware endpoints and the UI). The puzzle contract lives in lib/types.ts;
// this file is everything that hangs off a signed-in user.

import type { GameResult } from "@/lib/streak";

/** One recorded daily attempt. */
export interface AttemptRecord {
  puzzleId: string;
  dayNumber: number;
  solved: boolean;
  timeMs: number;
  attemptedAt: string; // ISO timestamp
}

/** The onboarding profile fields (collected after first sign-in). */
export interface ProfileFields {
  username: string | null;
  province: string | null;
  /** Optional. */
  educationalInstitution: string | null;
}

/** What the onboarding form submits — required fields are non-empty strings. */
export interface ProfileForm {
  username: string;
  province: string;
  educationalInstitution: string | null;
}

/** Lightweight profile read — used for the onboarding gate. */
export interface ProfileSummary extends ProfileFields {
  isAdmin: boolean;
  onboarded: boolean;
}

/** GET /api/me — the signed-in user's profile + derived stats + history. */
export interface MeResponse extends ProfileFields {
  email: string;
  isAdmin: boolean;
  /** True once the required onboarding fields are filled in. */
  onboarded: boolean;
  /** Live streak: the run ending today/yesterday, else 0. */
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  /** Most recent day the user attempted anything (null if never). */
  lastDayNumber: number | null;
  history: AttemptRecord[];
}

/**
 * POST /api/me/import — push the browser's existing localStorage state up once,
 * so players who started before accounts existed keep their record. Backfills a
 * single `attempts` row for `lastDayNumber` if the server has none. Idempotent.
 */
export interface ImportRequest {
  lastPlayedDate: string;
  lastDayNumber: number;
  currentStreak: number;
  longestStreak: number;
  lastResult: GameResult;
  lastTimeMs: number;
}

export interface ImportResponse {
  imported: boolean; // false if the server already had a row for that day
}

/**
 * Extended response of POST /api/puzzle/validate. The base fields (`correct`,
 * `explanation`) match ValidateResponse in lib/types.ts; the rest are present
 * only when the request carried a session.
 */
export interface ValidateResultWithAccount {
  correct: boolean;
  explanation: string;
  /** Present when signed in. */
  currentStreak?: number;
  longestStreak?: number;
  /** True if an attempt for this day already existed (this submit was ignored). */
  alreadyPlayed?: boolean;
}

/** GET /api/admin/overview — aggregates for the bootcamp organizer. */
export interface AdminOverview {
  totalUsers: number;
  totalAttempts: number;
  totalSolved: number;
  recentSignups: { email: string; createdAt: string }[];
  /** Per Swordle day: how many users attempted it and how many solved it. */
  byDay: { dayNumber: number; players: number; solved: number }[];
  /** Histogram of users' current live streaks (key = streak length). */
  streakDistribution: { streak: number; users: number }[];
}

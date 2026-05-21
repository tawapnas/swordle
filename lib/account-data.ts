import "server-only";

// Server-side data access for the account layer. Both the API routes and the
// /admin server component use these, so they live here rather than inline in a
// route handler.

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type {
  AdminOverview,
  AttemptRecord,
  MeResponse,
  ProfileFields,
  ProfileForm,
  ProfileSummary,
} from "@/lib/account";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  createSupabaseAdminClient,
  isAdminConfigured,
  isAdminEmail,
} from "@/lib/supabase/admin";
import { getPuzzleStore } from "@/lib/puzzleStore";
import { getTodayPuzzle } from "@/lib/daily";

// ---------------------------------------------------------------------------
// Row shapes. The Supabase JS client returns loosely-typed `data`; we narrow it
// through `unknown` into these before use.
// ---------------------------------------------------------------------------

/** Columns selected from `profiles` everywhere (kept in sync with toProfileRow). */
const PROFILE_COLUMNS =
  "is_admin, username, province, educational_institution";

interface ProfileRow {
  is_admin: boolean;
  username: string | null;
  province: string | null;
  educational_institution: string | null;
}

interface AttemptRow {
  user_id: string;
  puzzle_id: string;
  day_number: number;
  solved: boolean;
  time_ms: number;
  attempted_at: string;
}

/** Shape returned by the `user_streak_summary` SQL function. */
export interface StreakSummaryRow {
  current_streak: number;
  longest_streak: number;
  total_solved: number;
  last_day_number: number | null;
  last_solved_day_number: number | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toAttemptRow(value: unknown): AttemptRow | null {
  const r = asRecord(value);
  if (!r) return null;
  if (typeof r.user_id !== "string") return null;
  if (typeof r.puzzle_id !== "string") return null;
  if (typeof r.day_number !== "number") return null;
  if (typeof r.solved !== "boolean") return null;
  return {
    user_id: r.user_id,
    puzzle_id: r.puzzle_id,
    day_number: r.day_number,
    solved: r.solved,
    time_ms: num(r.time_ms),
    attempted_at: typeof r.attempted_at === "string" ? r.attempted_at : "",
  };
}

function toAttemptRows(value: unknown): AttemptRow[] {
  if (!Array.isArray(value)) return [];
  const out: AttemptRow[] = [];
  for (const item of value) {
    const row = toAttemptRow(item);
    if (row) out.push(row);
  }
  return out;
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function toProfileRow(value: unknown): ProfileRow | null {
  const r = asRecord(value);
  if (!r) return null;
  return {
    is_admin: r.is_admin === true,
    username: strOrNull(r.username),
    province: strOrNull(r.province),
    educational_institution: strOrNull(r.educational_institution),
  };
}

function profileFieldsOf(row: ProfileRow): ProfileFields {
  return {
    username: row.username,
    province: row.province,
    educationalInstitution: row.educational_institution,
  };
}

/** Onboarding is complete once the required fields (username + province) are set. */
export function isProfileComplete(p: ProfileFields): boolean {
  return Boolean(p.username && p.province);
}

function toStreakSummary(value: unknown): StreakSummaryRow | null {
  // The RPC is `returns table (...)`, so supabase-js yields an array of rows.
  const row = Array.isArray(value) ? asRecord(value[0]) : asRecord(value);
  if (!row) return null;
  return {
    current_streak: num(row.current_streak),
    longest_streak: num(row.longest_streak),
    total_solved: num(row.total_solved),
    last_day_number: numOrNull(row.last_day_number),
    last_solved_day_number: numOrNull(row.last_solved_day_number),
  };
}

// ---------------------------------------------------------------------------
// Live-streak helpers
// ---------------------------------------------------------------------------

/**
 * The "live" streak: the streak summary's `current_streak`, but only if the
 * user's most recent solved day is today or yesterday — otherwise the run has
 * lapsed and the live streak is 0.
 */
export function liveStreakFromSummary(
  summary: Pick<StreakSummaryRow, "current_streak" | "last_solved_day_number">,
  todayDayNumber: number,
): number {
  const last = summary.last_solved_day_number;
  if (last != null && last >= todayDayNumber - 1) return summary.current_streak;
  return 0;
}

/**
 * Derive a user's live streak purely from their attempt rows (used by the admin
 * dashboard, which reads everyone's attempts at once via the service role and
 * can't call the per-user RPC for each). Returns the length of the run of
 * consecutive solved day_numbers ending at the user's max solved day, but only
 * if that day is >= today - 1; else 0.
 */
export function liveStreakFromAttempts(
  attempts: { dayNumber: number; solved: boolean }[],
  todayDayNumber: number,
): number {
  const solvedDays = attempts
    .filter((a) => a.solved)
    .map((a) => a.dayNumber)
    .sort((a, b) => a - b);
  if (solvedDays.length === 0) return 0;
  const lastSolved = solvedDays[solvedDays.length - 1];
  if (lastSolved < todayDayNumber - 1) return 0;

  let run = 1;
  for (let i = solvedDays.length - 2; i >= 0; i--) {
    if (solvedDays[i] === solvedDays[i + 1] - 1) run++;
    else if (solvedDays[i] === solvedDays[i + 1]) continue; // dup guard
    else break;
  }
  return run;
}

async function todayDayNumber(): Promise<number> {
  const { dayNumber } = getTodayPuzzle(await getPuzzleStore().getAll());
  return dayNumber;
}

// ---------------------------------------------------------------------------
// getMeData — the signed-in user's own profile, history and stats.
// ---------------------------------------------------------------------------

function emptyMe(user: User): MeResponse {
  return {
    email: user.email ?? "",
    isAdmin: isAdminEmail(user.email),
    username: null,
    province: null,
    educationalInstitution: null,
    onboarded: false,
    currentStreak: 0,
    longestStreak: 0,
    totalSolved: 0,
    lastDayNumber: null,
    history: [],
  };
}

/**
 * Lightweight profile read for the onboarding gate — just the profile row, not
 * the attempt history or streak RPC. Returns null if Supabase isn't configured
 * or the row doesn't exist (which shouldn't happen — the signup trigger creates
 * it — but is treated as "needs onboarding").
 */
export async function getProfileSummary(
  user: User,
): Promise<ProfileSummary | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[account-data] getProfileSummary:", error);
      return null;
    }
    const row = toProfileRow(data);
    if (!row) return null;
    const fields = profileFieldsOf(row);
    return {
      ...fields,
      isAdmin: row.is_admin || isAdminEmail(user.email),
      onboarded: isProfileComplete(fields),
    };
  } catch (err) {
    console.error("[account-data] getProfileSummary failed:", err);
    return null;
  }
}

/** Result of `saveProfile` — `username-taken` maps to a 409 in the route. */
export type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: "username-taken" };

/**
 * Write the onboarding fields to the user's own profile row (RLS: update/insert
 * own). Trims inputs; an empty educational institution becomes null. Usernames
 * are unique (case-insensitively) — a collision with another user surfaces as
 * `{ ok: false, error: "username-taken" }` rather than throwing.
 */
export async function saveProfile(
  user: User,
  form: ProfileForm,
): Promise<SaveProfileResult> {
  const username = form.username.trim();
  const province = form.province.trim();
  const educationalInstitution = form.educationalInstitution?.trim() || null;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      province,
      educational_institution: educationalInstitution,
    },
    { onConflict: "id" },
  );
  if (error) {
    // 23505 = unique_violation — the only unique constraint here is on username.
    if (error.code === "23505") return { ok: false, error: "username-taken" };
    console.error("[account-data] saveProfile:", error);
    throw error;
  }
  return { ok: true };
}

export async function getMeData(
  user: User,
  todayDayNumber: number,
): Promise<MeResponse> {
  if (!isSupabaseConfigured()) return emptyMe(user);

  try {
    const supabase = await createSupabaseServerClient();

    const [profileRes, attemptsRes, streakRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("attempts")
        .select("user_id, puzzle_id, day_number, solved, time_ms, attempted_at")
        .eq("user_id", user.id)
        .order("day_number", { ascending: false }),
      supabase.rpc("user_streak_summary", { p_user_id: user.id }),
    ]);

    if (profileRes.error) console.error("[account-data] profiles:", profileRes.error);
    if (attemptsRes.error) console.error("[account-data] attempts:", attemptsRes.error);
    if (streakRes.error) console.error("[account-data] streak rpc:", streakRes.error);

    const profile = toProfileRow(profileRes.data);
    const attempts = toAttemptRows(attemptsRes.data);
    const summary = toStreakSummary(streakRes.data);

    const history: AttemptRecord[] = attempts.map((a) => ({
      puzzleId: a.puzzle_id,
      dayNumber: a.day_number,
      solved: a.solved,
      timeMs: a.time_ms,
      attemptedAt: a.attempted_at,
    }));

    const currentStreak = summary
      ? liveStreakFromSummary(summary, todayDayNumber)
      : 0;

    const fields: ProfileFields = profile
      ? profileFieldsOf(profile)
      : { username: null, province: null, educationalInstitution: null };

    return {
      email: user.email ?? "",
      isAdmin: (profile?.is_admin ?? false) || isAdminEmail(user.email),
      ...fields,
      onboarded: isProfileComplete(fields),
      currentStreak,
      longestStreak: summary?.longest_streak ?? 0,
      totalSolved: summary?.total_solved ?? 0,
      lastDayNumber: summary?.last_day_number ?? (history[0]?.dayNumber ?? null),
      history,
    };
  } catch (err) {
    console.error("[account-data] getMeData failed:", err);
    return emptyMe(user);
  }
}

// ---------------------------------------------------------------------------
// recordValidateAttempt — called from POST /api/puzzle/validate when a session
// is present. Upserts the day's attempt (first-write-wins), then returns the
// account fields for ValidateResultWithAccount. Never throws — on any Supabase
// failure it returns null and the caller falls back to the plain response.
// ---------------------------------------------------------------------------

export interface ValidateAccountFields {
  currentStreak: number;
  longestStreak: number;
  alreadyPlayed: boolean;
}

export async function recordValidateAttempt(
  user: User,
  puzzleId: string,
  dayNumber: number,
  solved: boolean,
  timeMs: number,
): Promise<ValidateAccountFields | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();

    const { data: inserted, error: upsertError } = await supabase
      .from("attempts")
      .upsert(
        {
          user_id: user.id,
          puzzle_id: puzzleId,
          day_number: dayNumber,
          solved,
          time_ms: Number.isFinite(timeMs) && timeMs >= 0 ? Math.floor(timeMs) : 0,
        },
        { onConflict: "user_id,day_number", ignoreDuplicates: true },
      )
      .select("id");
    if (upsertError) {
      console.error("[account-data] validate upsert:", upsertError);
      return null;
    }
    // ignoreDuplicates: a conflicting row yields zero returned rows.
    const alreadyPlayed = !inserted || inserted.length === 0;

    const { data: streakData, error: streakError } = await supabase.rpc(
      "user_streak_summary",
      { p_user_id: user.id },
    );
    if (streakError) {
      console.error("[account-data] validate streak rpc:", streakError);
      return { currentStreak: 0, longestStreak: 0, alreadyPlayed };
    }
    const summary = toStreakSummary(streakData);
    return {
      currentStreak: summary ? liveStreakFromSummary(summary, dayNumber) : 0,
      longestStreak: summary?.longest_streak ?? 0,
      alreadyPlayed,
    };
  } catch (err) {
    console.error("[account-data] recordValidateAttempt failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// importLegacyAttempt — POST /api/me/import. Backfills a single attempts row
// for `lastDayNumber` if the server has none. Idempotent.
// ---------------------------------------------------------------------------

export async function importLegacyAttempt(
  user: User,
  lastDayNumber: number,
  solved: boolean,
  timeMs: number,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const all = await getPuzzleStore().getAll();
  const len = all.length;
  const idx = (((lastDayNumber - 1) % len) + len) % len;
  const puzzleId = all[idx].id;

  const supabase = await createSupabaseServerClient();
  const { data: inserted, error } = await supabase
    .from("attempts")
    .upsert(
      {
        user_id: user.id,
        puzzle_id: puzzleId,
        day_number: lastDayNumber,
        solved,
        time_ms: Number.isFinite(timeMs) && timeMs >= 0 ? Math.floor(timeMs) : 0,
      },
      { onConflict: "user_id,day_number", ignoreDuplicates: true },
    )
    .select("id");
  if (error) {
    console.error("[account-data] import upsert:", error);
    throw error;
  }
  return Boolean(inserted && inserted.length > 0);
}

// ---------------------------------------------------------------------------
// getAdminOverview — cross-user aggregates via the service-role client.
// ---------------------------------------------------------------------------

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
}

async function listAllUsers(admin: SupabaseClient): Promise<AdminUser[]> {
  // A bootcamp cohort is small; one page (default 50) is plenty. We page through
  // a few just in case, but cap it — see the v2 note in the handoff.
  const PER_PAGE = 1000;
  const MAX_PAGES = 10;
  const users: AdminUser[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      console.error("[account-data] listUsers:", error);
      break;
    }
    const batch = data?.users ?? [];
    for (const u of batch) {
      users.push({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at ?? "",
      });
    }
    if (batch.length < PER_PAGE) break;
  }
  return users;
}

function emptyOverview(): AdminOverview {
  return {
    totalUsers: 0,
    totalAttempts: 0,
    totalSolved: 0,
    recentSignups: [],
    byDay: [],
    streakDistribution: [],
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (!isSupabaseConfigured() || !isAdminConfigured()) return emptyOverview();

  try {
    const admin = createSupabaseAdminClient();
    const today = await todayDayNumber();

    const [users, attemptsRes] = await Promise.all([
      listAllUsers(admin),
      admin
        .from("attempts")
        .select("user_id, puzzle_id, day_number, solved, time_ms, attempted_at"),
    ]);
    if (attemptsRes.error) console.error("[account-data] admin attempts:", attemptsRes.error);
    const attempts = toAttemptRows(attemptsRes.data);

    const totalSolved = attempts.filter((a) => a.solved).length;

    const recentSignups = [...users]
      .filter((u) => u.createdAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((u) => ({ email: u.email, createdAt: u.createdAt }));

    // byDay: group attempts by day_number.
    const byDayMap = new Map<number, { players: number; solved: number }>();
    for (const a of attempts) {
      const entry = byDayMap.get(a.day_number) ?? { players: 0, solved: 0 };
      entry.players += 1;
      if (a.solved) entry.solved += 1;
      byDayMap.set(a.day_number, entry);
    }
    const byDay = [...byDayMap.entries()]
      .map(([dayNumber, v]) => ({ dayNumber, players: v.players, solved: v.solved }))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    // streakDistribution: per user, derive their live streak from their attempts.
    const attemptsByUser = new Map<string, { dayNumber: number; solved: boolean }[]>();
    for (const a of attempts) {
      const list = attemptsByUser.get(a.user_id) ?? [];
      list.push({ dayNumber: a.day_number, solved: a.solved });
      attemptsByUser.set(a.user_id, list);
    }
    const streakHist = new Map<number, number>();
    for (const list of attemptsByUser.values()) {
      const s = liveStreakFromAttempts(list, today);
      if (s <= 0) continue;
      streakHist.set(s, (streakHist.get(s) ?? 0) + 1);
    }
    const streakDistribution = [...streakHist.entries()]
      .map(([streak, count]) => ({ streak, users: count }))
      .sort((a, b) => a.streak - b.streak);

    return {
      totalUsers: users.length,
      totalAttempts: attempts.length,
      totalSolved,
      recentSignups,
      byDay,
      streakDistribution,
    };
  } catch (err) {
    console.error("[account-data] getAdminOverview failed:", err);
    return emptyOverview();
  }
}

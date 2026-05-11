# Swordle

The daily SwiftUI puzzle. One puzzle a day, ~60 seconds to solve, keep your streak alive — Wordle, but for SwiftUI fundamentals. Built for middle schoolers prepping for an iOS bootcamp.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Bilingual out of the box (English & Thai — toggle in the corner; URLs are `/en/...` and `/th/...`). With no configuration the game runs anonymously — daily puzzle, 60-second timer, sharing, and a localStorage streak, no sign-in. Once you [configure Supabase](#sign-in--accounts-supabase), the app is **gated behind a sign-in welcome screen** (email magic link or Google) and streaks/records are stored server-side, with an `/admin` dashboard.

> `next-intl@4` lists Next 16 as a stable peer dep; run `npm install --legacy-peer-deps` to satisfy it against the `16.x-canary` pin in `package.json`.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at <http://localhost:3000> |
| `npm run build` | Production build — **see [Known issues](#known-issues)** |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, `eslint-config-next`) |

No test runner is configured. `npx tsc --noEmit` is the type-check.

## How it works

- **One puzzle per day, the same for everyone.** The puzzle for a UTC date is picked deterministically: day 1 is Jan 1 2026 (`EPOCH_UTC` in `lib/daily.ts`), and the puzzle index wraps through the bank when it runs out. `GET /api/puzzle/today` returns today's puzzle **without the answer**.
- **Test the rotation** in dev: `GET /api/puzzle/today?date=2026-01-04` (the `?date=` override is ignored in production).
- **One attempt per day.** Signed out, that's enforced by `localStorage["swordle:state"]` (clearing it lets you replay). Signed in, it's enforced server-side by a `unique (user_id, day_number)` row in Postgres.
- **Answer checking is server-side.** The client `POST`s its answer to `/api/puzzle/validate`; the answer never reaches the browser. The response always includes a teaching `explanation`.
- **Streaks**: solve on consecutive days → streak grows; miss a day or fail → it resets. Shown on the result screen with a 🔥, and shareable as `Swordle #14  ✅  0:42  🔥7`.

### Puzzle types

1. **Spot-the-Bug** — pick the buggy line out of a snippet.
2. **Predict-the-Render** — pick the screen (an SVG mockup) that matches the code.
3. **Fill-the-Modifier** — choose the SwiftUI modifier that goes in the blank.
4. **Syntax-Sort** — reorder shuffled lines into a valid view (tap-to-swap + up/down arrows; no drag-and-drop library).

## Adding a puzzle

Puzzles live in [`data/puzzles.json`](data/puzzles.json) — an array typed against the discriminated `Puzzle` union in [`lib/types.ts`](lib/types.ts). To add one, append an object with:

- `id` — stable and unique, e.g. `"2026-02-01-spotbug-07"`
- `type` — `"spot-bug" | "predict-render" | "fill-modifier" | "syntax-sort"`
- `prompt` — the line shown above the puzzle
- `difficulty` — `1 | 2 | 3` (informational for now; keep early puzzles at `1`)
- `explanation` — shown on the result screen, always (the teaching moment)
- `payload` — type-specific (see `lib/types.ts`)
- `answer` — type-specific; **stays server-side, never sent to the client**

Example (spot-the-bug):

```json
{
  "id": "2026-01-01-spotbug-01",
  "type": "spot-bug",
  "prompt": "Which line breaks this view?",
  "difficulty": 1,
  "payload": {
    "codeLines": [
      "struct ContentView: View {",
      "    var body: some View {",
      "        VStack {",
      "            Text(Hello, world!)",
      "        }",
      "    }",
      "}"
    ]
  },
  "answer": { "buggyLineIndex": 3 },
  "explanation": "String literals in Swift need quotes. It should be Text(\"Hello, world!\")."
}
```

For the other types: `predict-render` → `payload.code` + `payload.options` (4 items, each `{ id, mockupSvg }` where `mockupSvg` is inline `<svg>…</svg>` markup) + `answer.correctOptionId`; `fill-modifier` → `payload.codeBefore` + `payload.codeAfter` + `payload.options` (4 strings) + `answer.correctIndex`; `syntax-sort` → `payload.shuffledLines` + `answer.correctOrder` (a permutation of the line indices, in the order they should appear). Run `npx tsc --noEmit` after editing — the JSON is checked against the type. Keep the SwiftUI realistic and current; kids will read it.

## Sign-in & accounts (Supabase)

Without Supabase env vars the game just runs (anonymous, localStorage streak — no sign-in screen). **With** Supabase configured, `/` becomes a welcome/sign-in screen and you must sign in (email magic link or Google) to reach the game; streaks and attempt history are then stored in Postgres and the `/admin` dashboard works. Sign-in lands at `/auth/callback`, which exchanges the code for a session and redirects on. **First time in, the user fills out a short account form** at `/onboarding` (first name, last name, team name — optional, and school) before the game opens; after that they go straight to the puzzle.

### 1. Create the Supabase project, enable auth

1. Create a Supabase project.
2. **Authentication → Providers → Email**: enable it (magic link is the default).
3. **Authentication → Providers → Google** (optional, for the "Continue with Google" button): toggle on, and paste a Google OAuth **Client ID + Client secret**. To get those: in [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → *Create credentials → OAuth client ID* → *Web application*; under **Authorized redirect URIs** add `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase shows this exact URL on the provider page). You'll also need to configure the OAuth consent screen. Without this, the Google button just surfaces an error — email sign-in still works.
4. **Authentication → URL Configuration**: set the **Site URL** and add **Redirect URLs** — `http://localhost:3000/auth/callback` for local dev, plus `https://your-domain/auth/callback` for production.

### 2. Run the migrations

Run the files in [`supabase/migrations/`](supabase/migrations/) in order, in the dashboard SQL editor (or `supabase db push` with the Supabase CLI):

- `0001_init.sql` — `profiles` + `attempts`, the `user_streak_summary` function, RLS policies, and a trigger that makes a profile row on signup (works for both email and Google users).
- `0002_profile_onboarding.sql` — adds `first_name` / `last_name` / `team_name` / `school` to `profiles` for the onboarding form, plus an insert-own RLS policy.

Both are idempotent (safe to re-run).

### 3. Set env vars

`cp .env.local.example .env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — Settings → API; **server-only**, never `NEXT_PUBLIC_`-prefixed (the `/admin` dashboard uses it to read across users)
- `ADMIN_EMAILS` — comma-separated emails allowed at `/admin`

(Google sign-in has **no app env vars** — its credentials live in the Supabase dashboard, step 1.3.) Restart `npm run dev`, then sign in. To grant admin without using the `ADMIN_EMAILS` allowlist, after a user has signed in once: `update public.profiles set is_admin = true where id = '<auth user id>';`. In production, set the same env vars on your host (e.g. Vercel project settings). `proxy.ts` refreshes the auth cookie on each request and no-ops entirely when the Supabase env vars are absent.

> **COPPA note.** These are real accounts (email or Google); in the US, collecting personal info from users under 13 requires verifiable parental consent. Handle that out of band — the bootcamp collects consent, uses a parent/guardian email, or an organizer provisions accounts. No code change, just an obligation.

## Project structure

```
app/
  page.tsx                  gate: no session → <WelcomeScreen/>; not onboarded → /onboarding; else → <GamePage/>
  layout.tsx                fonts (LINE Seed Sans TH + Geist Mono), metadata
  globals.css               Tailwind v4 entry + @theme tokens (colors, fonts)
  login/page.tsx            standalone sign-in page (redirects to / if already signed in)
  onboarding/page.tsx       first-run account form (name / team / school) → <OnboardingForm/>
  admin/page.tsx            gated dashboard (server component)
  auth/callback/route.ts    sign-in landing → exchanges the code for a session, redirects on
  api/
    puzzle/today/route.ts   GET today's puzzle (no answer); ?date= override in dev
    puzzle/validate/route.ts POST {id, answer, timeMs?} → {correct, explanation, streak fields if signed in}
    me/route.ts             GET the signed-in user's profile + history + streaks
    me/profile/route.ts      POST the onboarding fields → user's profile row
    me/import/route.ts       POST one-time localStorage → server backfill
    admin/overview/route.ts  GET aggregates (admin only)
components/
  WelcomeScreen.tsx         the pre-game gate (pitch + <LoginForm/>)
  LoginForm.tsx             email magic link + "Continue with Google" (client)
  OnboardingForm.tsx        first/last name, team (optional), school → POST /api/me/profile (client)
  GamePage.tsx              orchestrator: loading → playing → result / already-played
  Timer.tsx, Toast.tsx, CodeBlock.tsx, AccountBar.tsx
  ResultCard.tsx / ResultScreen.tsx / AlreadyPlayed.tsx
  puzzles/                  one component per type + PuzzleRenderer + shared props
  admin/                    dashboard pieces (stat cards, by-day table, histogram, signups)
lib/
  types.ts                  the Puzzle discriminated union + PublicPuzzle + response types
  daily.ts                  deterministic daily selection
  puzzleStore.ts            PuzzleStore interface + JSON-backed impl (swap for a DB later)
  validate.ts, public.ts    per-type answer checking; answer-stripping chokepoint
  streak.ts                 localStorage state + streak transitions (client)
  share.ts                  the shareable result string
  account.ts                shared types for the account/admin API
  account-data.ts           server-side Supabase queries (getMeData, getAdminOverview)
  gameSession.ts            helpers extracted from GamePage
  supabase/{server,client,admin}.ts   Supabase clients (cookie / browser / service-role)
data/puzzles.json           the puzzle bank (24 puzzles, 6 of each type)
supabase/migrations/        SQL migrations
proxy.ts                    refreshes the Supabase auth cookie (Next 16's `middleware` rename)
```

## Stack

Next.js 16 (App Router, Turbopack — **canary**, pinned in `package.json`) · React 19 · TypeScript strict (`@/*` → repo root) · Tailwind CSS v4 (CSS-first config in `app/globals.css`, no `tailwind.config.js`) · `next/font` with [LINE Seed Sans TH](https://seed.line.me) (self-hosted from `app/fonts/`, SIL OFL — see `app/fonts/LICENSE.txt`) and Geist Mono · Supabase (Postgres + Auth) for the optional account layer · `lucide-react` for icons.

> Because Next is pinned to a canary, some APIs and file conventions differ from the stable docs (e.g. `middleware.ts` is now `proxy.ts`). When working on Next-specific code, check `node_modules/next/dist/docs/01-app/`.

## Known issues

- **`npm run build` fails on Apple Silicon Macs running an x86-64 Node under Rosetta** — Tailwind v4 needs the `lightningcss` native binary matching your Node arch, and only `lightningcss-darwin-arm64` gets installed. `npm run dev` is unaffected. Fix: install an arm64 build of Node (nvm/Homebrew) and reinstall deps. (`build` works fine on Linux CI / Vercel.)
- A network error while submitting an answer currently counts the attempt as a miss (and resets the streak). Soften to a retry if that matters for your players.

## Languages

The UI and per-puzzle text are localized to **English** and **Thai**, switchable via the corner toggle (or by editing the URL prefix `/en/...` ↔ `/th/...`). UI strings live in [`messages/en.json`](messages/en.json) and [`messages/th.json`](messages/th.json) under namespaces (`Brand`, `Welcome`, `Login`, `Onboarding`, `Game`, `Result`, `Admin`, …). Per-puzzle `prompt` and `explanation` are stored as `{ en, th }` objects in `data/puzzles.json` and resolved server-side by [`lib/public.ts`](lib/public.ts) before reaching the client. SwiftUI code and SF Symbol names inside puzzles stay English — they're a programming language, not prose.

**Adding a new language:** add the locale to `i18n/routing.ts`'s `locales`, drop in `messages/<code>.json` (copy from `en.json` and translate), and add the field to every puzzle's `prompt`/`explanation` in `data/puzzles.json` (the `LocalizedString` type in `lib/types.ts` will enforce it).

**Editing translations:** `messages/*.json` is hot-reloaded by `npm run dev`. For the puzzle bank, edit the Thai strings in [`scripts/localize-puzzles.mjs`](scripts/localize-puzzles.mjs)'s `TRANSLATIONS` map and re-run it, or hand-edit `data/puzzles.json` directly.

The font (LINE Seed Sans TH) already ships both Latin and Thai glyphs, so no extra font work was needed.

Supabase magic-link **email templates** are templated in the Supabase dashboard, not in this repo — to localize the email body, configure a Thai variant there. The app already passes the locale through the redirect URL (`/<locale>/auth/callback`), so post-sign-in lands the user back in their language.

## Not in MVP (v2 ideas)

- Achievements / badges; leaderboard (with safe-listed display names for kids).
- Cross-day puzzle bank that doesn't loop after 24 days — add more puzzles or a real rotation strategy.
- Display-name editing; profile page.
- Rate limiting on `/api/puzzle/validate` and `/api/me/import`.
- Pause the timer when the tab is backgrounded.
- Move the admin streak aggregation into SQL (it currently loads all attempts into memory — fine at cohort scale).
- Swap the JSON puzzle bank for a database via the `PuzzleStore` interface.

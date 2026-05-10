# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js version — read this first

`package.json` pins `next@16.3.0-canary.14` (and `eslint-config-next` to match). This is **not** the Next.js in your training data — APIs, conventions, file structure, and defaults may differ, and there are breaking changes. Before writing any Next.js code, read the relevant guide under `node_modules/next/dist/docs/` (App Router docs live in `01-app/`) and heed deprecation notices. This is also enforced via `AGENTS.md` (imported below).

## Layout

This directory is the git repo and the Next.js app — there is no nested project folder. Run all `npm` / `git` commands from here.

- `app/` — App Router. `page.tsx` is the gate (signed in, or no Supabase configured → the game; else the welcome/sign-in screen); `api/` has the puzzle + account + admin route handlers; `login/`, `admin/`, `auth/callback/` are the auth pages/landing. `proxy.ts` (repo root — Next 16's renamed `middleware`) refreshes the Supabase auth cookie.
- `components/` — UI: `GamePage.tsx` orchestrator, `puzzles/*` (one per puzzle type + `PuzzleRenderer`), result/welcome/login/account components, `admin/*` dashboard pieces.
- `lib/` — `types.ts` (the `Puzzle` discriminated union + `PublicPuzzle`), `daily.ts` (deterministic daily selection), `puzzleStore.ts` (data-access seam), `validate.ts`/`public.ts`, `streak.ts` (localStorage), `share.ts`, `account.ts`/`account-data.ts` (account API types + server-side Supabase queries), `supabase/*` (clients).
- `data/puzzles.json` — the puzzle bank (24 puzzles, 6 of each type), authored against `lib/types.ts`. `supabase/migrations/` — SQL.
- `public/` — static assets. `skills/` — vendored Vercel agent skills (`deploy-to-vercel`, `vercel-composition-patterns`, `vercel-react-best-practices`, `vercel-react-view-transitions`), pinned by hash in `skills-lock.json`; reference/tooling, not application code.

What the app does: a daily SwiftUI puzzle game (Wordle-style) — 4 puzzle types, 60s timer, streaks (localStorage when anonymous, Postgres when signed in), shareable result. Optional Supabase layer (email magic link + Google auth, server-side records, `/admin` dashboard) — see `README.md` for setup. Without Supabase env vars the game runs anonymously with no sign-in.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint

There is no test runner configured.

## Stack notes

- **Tailwind CSS v4** — no `tailwind.config.js`; config is CSS-first in `app/globals.css` (`@import "tailwindcss"` + the `@theme inline` block). Build wiring is the `@tailwindcss/postcss` plugin in `postcss.config.mjs`. Theme tokens (`--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`) and `prefers-color-scheme` dark mode are defined there.
- **Fonts** — primary sans is **LINE Seed Sans TH**, self-hosted via `next/font/local` from `app/fonts/*.woff2` (weights 100/400/700/800/900; not on Google Fonts — files vendored from the `lazywasabi/thai-web-fonts` jsDelivr mirror, SIL OFL, see `app/fonts/LICENSE.txt`). Mono is Geist Mono via `next/font/google`. Both are wired in `app/layout.tsx` as `--font-line-seed-sans-th` / `--font-geist-mono`, which feed the `--font-sans` / `--font-mono` theme tokens; `globals.css` `body` uses `var(--font-sans)`.
- **TypeScript** — strict mode; path alias `@/*` → repo root (`tsconfig.json`).
- **ESLint** — flat config (`eslint.config.mjs`): `eslint-config-next` core-web-vitals + typescript.
- `next.config.ts` is currently empty (default config).

@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js version — read this first

`package.json` pins `next@16.3.0-canary.14` (and `eslint-config-next` to match). This is **not** the Next.js in your training data — APIs, conventions, file structure, and defaults may differ, and there are breaking changes. Before writing any Next.js code, read the relevant guide under `node_modules/next/dist/docs/` (App Router docs live in `01-app/`) and heed deprecation notices. This is also enforced via `AGENTS.md` (imported below).

## Layout

This directory is the git repo and the Next.js app — there is no nested project folder. Run all `npm` / `git` commands from here.

- `app/` — App Router. All pages live under `app/[locale]/` (i18n is path-based via `next-intl`, locales `en`/`th`): `[locale]/page.tsx` is the gate, plus `[locale]/{login,admin,onboarding,auth/callback}/`. `api/` (at root, NOT under `[locale]`) has the puzzle + account + admin route handlers; they read the `NEXT_LOCALE` cookie via `lib/server-locale.ts` to localize puzzle content. `proxy.ts` (repo root — Next 16's renamed `middleware`) composes `next-intl`'s middleware with the Supabase auth-cookie refresh; `/api/*` paths skip the intl rewrite.
- `components/` — UI: `GamePage.tsx` orchestrator, `puzzles/*` (one per puzzle type + `PuzzleRenderer`), result/welcome/login/account components, `admin/*` dashboard pieces.
- `lib/` — `types.ts` (the `Puzzle` discriminated union; `prompt`/`explanation` are `LocalizedString = Record<Locale, string>`. `PublicPuzzle` carries already-resolved plain strings), `daily.ts` (deterministic daily selection), `puzzleStore.ts` (data-access seam), `validate.ts`/`public.ts` (`toPublicPuzzle(puzzle, locale)` resolves localized fields), `server-locale.ts` (read locale from `NEXT_LOCALE` cookie or `?locale=` for API routes), `streak.ts` (localStorage), `share.ts`, `account.ts`/`account-data.ts` (account API types + server-side Supabase queries), `supabase/*` (clients).
- `i18n/` — `routing.ts` (locales + `localePrefix: "always"`), `request.ts` (next-intl config), `navigation.ts` (locale-aware Link/redirect wrappers). Message catalogs in `messages/{en,th}.json`. UI strings live there; component code calls `useTranslations(...)` / `getTranslations(...)`. SwiftUI code in puzzles stays English (it's a programming language).
- `data/puzzles.json` — the puzzle bank (24 puzzles, 6 of each type), authored against `lib/types.ts`. `supabase/migrations/` — SQL.
- `public/` — static assets. `skills/` — vendored Vercel agent skills (`deploy-to-vercel`, `vercel-composition-patterns`, `vercel-react-best-practices`, `vercel-react-view-transitions`), pinned by hash in `skills-lock.json`; reference/tooling, not application code.

What the app does: a daily SwiftUI puzzle game (Wordle-style) — 4 puzzle types, 60s timer, streaks (localStorage when anonymous, Postgres when signed in), shareable result. Bilingual UI **and** puzzle content (English + Thai) via `next-intl`, switchable in-app. Optional Supabase layer (email magic link + Google auth, server-side records, `/admin` dashboard) — see `README.md` for setup. Without Supabase env vars the game runs anonymously with no sign-in (but still localized).

When `npm install`-ing, use `--legacy-peer-deps` — `next-intl@4` declares Next 16 as a stable peer dep and won't match the `16.x-canary` pin without it. (Functionally compatible.)

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

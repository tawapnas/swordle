import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

// The pre-game gate: shown at `/` when Supabase is configured and there's no
// session. Pitch + sign-in options. Once signed in, `/` renders the game.

export default function WelcomeScreen() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl" aria-hidden>
          ⚔️
        </span>
        <h1 className="text-4xl font-black tracking-tight text-brand">Swordle</h1>
        <p className="text-lg font-bold text-ink">The daily SwiftUI puzzle.</p>
        <p className="text-sm text-ink-soft">
          A new puzzle every day. Sixty seconds on the clock. Keep your streak
          alive.
        </p>
      </header>

      <ul className="flex flex-col gap-2 rounded-2xl bg-card px-5 py-4 text-sm text-ink ring-1 ring-line">
        <li>🐛 Spot the bug in a snippet</li>
        <li>🖼️ Predict what a view renders</li>
        <li>🧩 Fill in the missing modifier</li>
        <li>🔀 Sort the lines into a working view</li>
      </ul>

      <section className="flex flex-col gap-3">
        <p className="text-center text-sm font-bold text-ink">
          Sign in to play
        </p>
        <Suspense fallback={<div className="h-56" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}

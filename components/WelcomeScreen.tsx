import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/LoginForm";
import LanguageToggle from "@/components/LanguageToggle";

// The pre-game gate: shown at `/<locale>` when Supabase is configured and
// there's no session. Pitch + sign-in options + language toggle.

export default async function WelcomeScreen() {
  const tBrand = await getTranslations("Brand");
  const tWelcome = await getTranslations("Welcome");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>

      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl" aria-hidden>
          ⚔️
        </span>
        <h1 className="text-4xl font-black tracking-tight text-brand">
          {tBrand("name")}
        </h1>
        <p className="text-lg font-bold text-ink">{tWelcome("tagline")}</p>
        <p className="text-sm text-ink-soft">{tWelcome("pitch")}</p>
      </header>

      <ul className="flex flex-col gap-2 rounded-2xl bg-card px-5 py-4 text-sm text-ink ring-1 ring-line">
        <li>{tWelcome("types.spotBug")}</li>
        <li>{tWelcome("types.fillModifier")}</li>
        <li>{tWelcome("types.syntaxSort")}</li>
      </ul>

      <section className="flex flex-col gap-3">
        <p className="text-center text-sm font-bold text-ink">
          {tWelcome("signInToPlay")}
        </p>
        <Suspense fallback={<div className="h-56" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}

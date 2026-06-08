import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/LoginForm";

// The pre-game gate: shown at `/<locale>` when Supabase is configured and
// there's no session. Pitch + sign-in options + language toggle.

export default async function WelcomeScreen() {
  const tBrand = await getTranslations("Brand");
  const tWelcome = await getTranslations("Welcome");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-5xl" aria-hidden>
          ⚔️
        </span>
        <h1 className="font-serif text-7xl text-ink sm:text-8xl">
          {tBrand("name")}
        </h1>
        <p className="text-lg font-bold text-ink sm:text-xl">{tWelcome("tagline")}</p>
      </header>

      <section className="flex flex-col gap-3">
        <Suspense fallback={<div className="h-56" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}

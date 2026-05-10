import { redirect } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";
import { getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getProfileSummary } from "@/lib/account-data";

export const metadata = {
  title: "Welcome — Swordle",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  // No auth backend → no onboarding; the game is open.
  if (!isSupabaseConfigured()) redirect("/");

  const user = await getSessionUser();
  if (!user) redirect("/login?next=/onboarding");

  // Already filled in? Straight to the game.
  const profile = await getProfileSummary(user);
  if (profile?.onboarded) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-2 text-center">
        <span className="text-5xl" aria-hidden>
          👋
        </span>
        <h1 className="text-3xl font-black tracking-tight text-brand">
          Welcome to Swordle!
        </h1>
        <p className="text-sm text-ink-soft">
          A couple of quick things before your first puzzle.
        </p>
      </header>

      <OnboardingForm email={user.email ?? ""} />
    </main>
  );
}

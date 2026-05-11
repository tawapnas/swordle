import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import GamePage from "@/components/GamePage";
import WelcomeScreen from "@/components/WelcomeScreen";
import { getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getProfileSummary } from "@/lib/account-data";

// Reads the auth cookie, so this route renders dynamically.
export const dynamic = "force-dynamic";

// GamePage uses `useSearchParams` (for the dev-only ?date= preview), which
// requires a Suspense boundary above it.
async function GameWithSuspense() {
  const t = await getTranslations("Game");
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
          <p className="mt-10 text-center text-ink-soft">{t("loading")}</p>
        </main>
      }
    >
      <GamePage />
    </Suspense>
  );
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // No Supabase configured → no auth backend to gate on; play directly.
  if (!isSupabaseConfigured()) return <GameWithSuspense />;

  const user = await getSessionUser();
  if (!user) return <WelcomeScreen />;

  // Signed in but hasn't completed the account form yet → onboarding first.
  const profile = await getProfileSummary(user);
  if (!profile?.onboarded) redirect(`/${locale}/onboarding`);

  return <GameWithSuspense />;
}

import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import OnboardingFlow from "@/components/OnboardingFlow";
import { getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getProfileSummary } from "@/lib/account-data";

export const metadata = {
  title: "Welcome — Swordle",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // No auth backend → no onboarding; the game is open.
  if (!isSupabaseConfigured()) redirect(`/${locale}`);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/onboarding`);

  // Already filled in? Straight to the game.
  const profile = await getProfileSummary(user);
  if (profile?.onboarded) redirect(`/${locale}`);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <OnboardingFlow
        initialUsername={profile?.username ?? ""}
        initialProvince={profile?.province ?? ""}
        initialInstitution={profile?.educationalInstitution ?? ""}
      />
    </main>
  );
}

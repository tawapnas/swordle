import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import OnboardingForm from "@/components/OnboardingForm";
import LanguageToggle from "@/components/LanguageToggle";
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

  const t = await getTranslations("Onboarding");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>
      <header className="flex flex-col gap-2 text-center">
        <span className="text-5xl" aria-hidden>
          {t("wave")}
        </span>
        <h1 className="text-3xl font-black tracking-tight text-brand">
          {t("title")}
        </h1>
        <p className="text-sm text-ink-soft">{t("subhead")}</p>
      </header>

      <OnboardingForm email={user.email ?? ""} />
    </main>
  );
}

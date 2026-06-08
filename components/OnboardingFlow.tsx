"use client";

// Two-step account-creation flow, shown on /[locale]/onboarding:
//   1. "form"  — the profile form (username / province / institution).
//   2. "ready" — a brief "how to play" screen, so the player isn't dropped
//                straight into the 60-second timed puzzle.
// It owns the per-step header and the final navigation into the game; the steps
// themselves are OnboardingForm and HowToPlay. No new route is needed — keeping
// this client-side means the intro shows exactly once, right after creation.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import OnboardingForm from "./OnboardingForm";
import HowToPlay from "./HowToPlay";

export default function OnboardingFlow({
  initialUsername = "",
  initialProvince = "",
  initialInstitution = "",
}: {
  initialUsername?: string;
  initialProvince?: string;
  initialInstitution?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Onboarding");
  const tHow = useTranslations("HowToPlay");
  const [step, setStep] = useState<"form" | "ready">("form");

  function goToGame() {
    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <>
      <header className="flex flex-col gap-2 text-center">
        <span className="text-5xl" aria-hidden>
          {step === "form" ? t("wave") : "🎉"}
        </span>
        <h1 className="text-3xl font-black tracking-tight text-ink">
          {step === "form" ? t("title") : tHow("title")}
        </h1>
        {step === "form" && (
          <p className="text-sm text-ink-soft">{t("subhead")}</p>
        )}
      </header>

      {step === "form" ? (
        <OnboardingForm
          initialUsername={initialUsername}
          initialProvince={initialProvince}
          initialInstitution={initialInstitution}
          onCreated={() => setStep("ready")}
        />
      ) : (
        <HowToPlay onStart={goToGame} />
      )}
    </>
  );
}

"use client";

import { useTranslations } from "next-intl";

// The brief "how to play" step shown right after account creation, before the
// player enters the timed game — a short reassurance, not a wall of rules. The
// heading lives in the parent (OnboardingFlow); this is the blurb + the button
// that actually starts the game.
export default function HowToPlay({ onStart }: { onStart: () => void }) {
  const t = useTranslations("HowToPlay");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-base leading-relaxed text-ink-soft">
        {t("body")}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="bg-brand px-6 py-3.5 text-base font-bold text-white transition active:translate-y-px active:bg-brand-dark"
      >
        {t("start")}
      </button>
    </div>
  );
}

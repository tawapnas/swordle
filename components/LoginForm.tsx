"use client";

// Sign-in: "Continue with Google" (OAuth). Google redirects away to the
// provider. Honors ?error=auth in the URL (the /auth/callback route redirects
// there when a code exchange fails) and forwards a same-origin ?next= through.

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "redirecting" } // Google OAuth: navigating to the provider
  | { kind: "error"; message: string };

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.09l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export default function LoginForm() {
  const t = useTranslations("Login");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const linkFailed = searchParams.get("error") === "auth";
  const nextParam = searchParams.get("next");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (!isSupabaseConfigured()) {
    return (
      <div className="border border-line bg-white px-5 py-6 text-sm text-ink">
        <p className="font-bold">{t("unconfiguredTitle")}</p>
        <p className="mt-1 text-ink-soft">{t("unconfiguredBody")}</p>
      </div>
    );
  }

  /** Where the provider should land — locale-aware, ?next= only when same-origin. */
  function callbackUrl(): string {
    const safeNext =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : null;
    const url = new URL(`/${locale}/auth/callback`, location.origin);
    if (safeNext) url.searchParams.set("next", safeNext);
    return url.toString();
  }

  function reportError(err: unknown) {
    setStatus({
      kind: "error",
      message: err instanceof Error ? err.message : "Something went wrong.",
    });
  }

  async function handleGoogle() {
    setStatus({ kind: "redirecting" });
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });
      // On success the browser navigates to Google; reaching here means it didn't.
      if (error) setStatus({ kind: "error", message: error.message });
    } catch (err) {
      reportError(err);
    }
  }

  const busy = status.kind === "redirecting";

  return (
    <div className="flex flex-col gap-4">
      {linkFailed && status.kind !== "error" && (
        <p
          role="alert"
          className="border-2 border-ink bg-white px-4 py-3 text-sm font-bold text-ink"
        >
          {t("linkFailed")}
        </p>
      )}
      {status.kind === "error" && (
        <p
          role="alert"
          className="border-2 border-ink bg-white px-4 py-3 text-sm font-bold text-ink"
        >
          {status.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex items-center justify-center gap-2.5 border-2 border-ink bg-white px-6 py-3.5 text-base font-bold text-ink transition hover:bg-ink hover:text-white active:translate-y-px disabled:opacity-60"
      >
        <GoogleMark />
        {status.kind === "redirecting" ? t("redirecting") : t("continueWithGoogle")}
      </button>
    </div>
  );
}

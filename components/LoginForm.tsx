"use client";

// Sign-in: "Continue with Google" (OAuth) and an email magic link. On magic-link
// success it swaps to a "check your email" state; Google redirects away to the
// provider. Honors ?error=auth in the URL (the /auth/callback route redirects
// there when a code exchange fails) and forwards a same-origin ?next= through.

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "sending" } // magic-link email in flight
  | { kind: "redirecting" } // Google OAuth: navigating to the provider
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.09l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const searchParams = useSearchParams();
  const linkFailed = searchParams.get("error") === "auth";
  const nextParam = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl bg-card px-5 py-6 text-sm text-ink ring-1 ring-line">
        <p className="font-bold">Sign-in isn&apos;t set up on this deployment yet.</p>
        <p className="mt-1 text-ink-soft">
          Add the Supabase environment variables to enable accounts. Until then
          the game runs without sign-in.
        </p>
      </div>
    );
  }

  /** Where the provider/email link should land — /auth/callback, same-origin ?next= only. */
  function callbackUrl(): string {
    const safeNext =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : null;
    const url = new URL("/auth/callback", location.origin);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus({ kind: "sending" });
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      setStatus({ kind: "sent", email: trimmed });
    } catch (err) {
      reportError(err);
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="animate-rise rounded-2xl bg-accent px-5 py-6 text-white">
        <p className="text-lg font-black">Check your email 📬</p>
        <p className="mt-1 text-sm opacity-90">
          We sent a magic link to{" "}
          <strong className="break-all">{status.email}</strong>. Open it on this
          device to sign in.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-4 text-sm font-bold underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  const busy = status.kind === "sending" || status.kind === "redirecting";

  return (
    <div className="flex flex-col gap-4">
      {linkFailed && status.kind !== "error" && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger-dark"
        >
          That link didn&apos;t work — try again.
        </p>
      )}
      {status.kind === "error" && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger-dark"
        >
          {status.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex items-center justify-center gap-2.5 rounded-2xl bg-card px-6 py-3.5 text-base font-bold text-ink shadow-sm ring-1 ring-line transition hover:ring-brand active:translate-y-px disabled:opacity-60"
      >
        <GoogleMark />
        {status.kind === "redirecting" ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs font-medium text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-bold text-ink">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
          className="rounded-2xl bg-card px-4 py-3 text-base text-ink shadow-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-60"
        >
          {status.kind === "sending" ? "Sending…" : "Email me a magic link"}
        </button>
        <p className="text-xs text-ink-soft">
          No password needed — we&apos;ll email you a link that signs you in.
        </p>
      </form>
    </div>
  );
}

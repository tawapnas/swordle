"use client";

// Small auth widget for the page header. Renders nothing if Supabase isn't
// configured. Signed in: shows the (truncated) email + a Sign out button.
// Signed out: a subtle "Sign in" link.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function AccountBar() {
  const router = useRouter();
  const t = useTranslations("AccountBar");
  const locale = useLocale();
  const [configured] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  if (!configured) return null;

  async function signOut() {
    setSigningOut(true);
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      router.refresh();
      setSigningOut(false);
    }
  }

  if (!user) {
    return (
      <Link
        href={`/${locale}/login`}
        className="shrink-0 text-xs font-bold text-ink-soft underline-offset-2 hover:text-brand hover:underline"
      >
        {t("signIn")}
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="max-w-[7.5rem] truncate text-xs font-medium text-ink-soft sm:max-w-[12rem]"
        title={user.email ?? undefined}
      >
        {user.email}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-ink-soft transition hover:bg-card hover:text-brand active:translate-y-px disabled:opacity-50"
      >
        {t("signOut")}
      </button>
    </div>
  );
}

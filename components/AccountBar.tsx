"use client";

// Account menu for the site header. Renders nothing if Supabase isn't configured
// or the visitor is signed out (sign-in lives on the welcome/login screens).
// Signed in: a round avatar (email initial) that opens a dropdown with the full
// email + a Sign out button. Closes on outside-click or Escape.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export default function AccountBar() {
  const router = useRouter();
  const t = useTranslations("AccountBar");
  const [configured] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close on outside-click / Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Hidden when there's no auth backend or no session — sign-in is offered on
  // the welcome and /login screens, so a header entry point would be redundant.
  if (!configured || !user) return null;

  async function signOut() {
    setSigningOut(true);
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      setOpen(false);
      router.refresh();
      setSigningOut(false);
    }
  }

  const email = user.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "?";

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("accountMenu")}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-black text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-rise absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-line"
        >
          <p
            className="break-all px-4 py-3 text-xs font-medium text-ink-soft"
            title={email}
          >
            {email}
          </p>
          <div className="h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className="block w-full px-4 py-3 text-left text-sm font-bold text-ink transition hover:bg-line hover:text-brand disabled:opacity-50"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

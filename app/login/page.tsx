import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Sign in — Swordle",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in? Nothing to do here.
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-brand">Swordle</h1>
        <p className="text-sm text-ink-soft">
          Sign in to play the daily puzzle and keep your streak across devices.
        </p>
      </header>

      <Suspense fallback={<div className="h-56" />}>
        <LoginForm />
      </Suspense>

      <Link
        href="/"
        className="text-sm font-bold text-ink-soft underline-offset-2 hover:text-brand hover:underline"
      >
        ← Back
      </Link>
    </main>
  );
}

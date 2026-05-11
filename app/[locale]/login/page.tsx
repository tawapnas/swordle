import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import LoginForm from "@/components/LoginForm";
import LanguageToggle from "@/components/LanguageToggle";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata = {
  title: "Sign in — Swordle",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Already signed in? Nothing to do here.
  const user = await getSessionUser();
  if (user) redirect(`/${locale}`);

  const tBrand = await getTranslations("Brand");
  const tLogin = await getTranslations("Login");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-brand">{tBrand("name")}</h1>
        <p className="text-sm text-ink-soft">{tLogin("subhead")}</p>
      </header>

      <Suspense fallback={<div className="h-56" />}>
        <LoginForm />
      </Suspense>

      <Link
        href={`/${locale}`}
        className="text-sm font-bold text-ink-soft underline-offset-2 hover:text-brand hover:underline"
      >
        {tLogin("back")}
      </Link>
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { isAdminConfigured, isAdminEmail } from "@/lib/supabase/admin";
import { getAdminOverview } from "@/lib/account-data";
import { listAllPuzzles } from "@/lib/puzzle-admin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = { title: "Admin — Swordle" };
export const dynamic = "force-dynamic";

async function NoAccess({ locale }: { locale: string }) {
  const tAdmin = await getTranslations("Admin");
  const tLogin = await getTranslations("Login");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        🔒
      </span>
      <h1 className="text-xl font-black text-ink">{tAdmin("noAccess")}</h1>
      <Link
        href={`/${locale}`}
        className="text-sm font-bold text-brand underline-offset-2 hover:underline"
      >
        {tLogin("back")}
      </Link>
    </main>
  );
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/admin`);
  if (!isAdminEmail(user.email)) return <NoAccess locale={locale} />;

  const overview = await getAdminOverview();
  const puzzlesConfigured = isAdminConfigured();
  const puzzles = puzzlesConfigured ? await listAllPuzzles() : [];
  return (
    <AdminDashboard
      overview={overview}
      configured={isSupabaseConfigured()}
      adminEmail={user.email ?? ""}
      puzzles={puzzles}
      puzzlesConfigured={puzzlesConfigured}
    />
  );
}

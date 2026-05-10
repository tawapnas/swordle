import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { getAdminOverview } from "@/lib/account-data";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = { title: "Admin — Swordle" };
export const dynamic = "force-dynamic";

function NoAccess() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        🔒
      </span>
      <h1 className="text-xl font-black text-ink">You don&apos;t have access to this page</h1>
      <p className="text-sm text-ink-soft">
        The admin dashboard is for the Swordle organizer.
      </p>
      <Link
        href="/"
        className="text-sm font-bold text-brand underline-offset-2 hover:underline"
      >
        ← Back to today&apos;s puzzle
      </Link>
    </main>
  );
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) return <NoAccess />;

  const overview = await getAdminOverview();
  return (
    <AdminDashboard
      overview={overview}
      configured={isSupabaseConfigured()}
      adminEmail={user.email ?? ""}
    />
  );
}

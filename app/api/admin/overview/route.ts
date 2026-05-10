// GET /api/admin/overview
//   → 200 AdminOverview  (cross-user aggregates for the bootcamp organizer)
//   → 401 if not signed in
//   → 403 if signed in but not an admin
//   → 503 if the service-role key isn't configured
//   → 500 on error
//
// Authorization: an email in ADMIN_EMAILS, OR the caller's profiles.is_admin.

import type { AdminOverview } from "@/lib/account";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { isAdminConfigured, isAdminEmail } from "@/lib/supabase/admin";
import { getAdminOverview } from "@/lib/account-data";

export const dynamic = "force-dynamic";

async function profileIsAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[api/admin/overview] profile lookup:", error);
      return false;
    }
    return (
      typeof data === "object" && data !== null && (data as { is_admin?: unknown }).is_admin === true
    );
  } catch (err) {
    console.error("[api/admin/overview] profile lookup failed:", err);
    return false;
  }
}

export async function GET(): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const authorized = isAdminEmail(user.email) || (await profileIsAdmin(user.id));
  if (!authorized) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured()) {
    return Response.json(
      { error: "Admin data layer not configured (SUPABASE_SERVICE_ROLE_KEY is unset)." },
      { status: 503 },
    );
  }

  try {
    const overview: AdminOverview = await getAdminOverview();
    return Response.json(overview);
  } catch (err) {
    console.error("[api/admin/overview] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import "server-only";

// Shared authorization gate for admin API routes.
//
//   const gate = await requireAdmin();
//   if (gate instanceof Response) return gate;   // 401 / 403 / 503
//   const { user } = gate;
//
// "Admin" = an email in ADMIN_EMAILS, OR the caller's profiles.is_admin. The
// 503 covers routes that need the service-role key (cross-user reads / writes).

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { isAdminConfigured, isAdminEmail } from "@/lib/supabase/admin";

async function profileIsAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[admin-guard] profile lookup:", error);
      return false;
    }
    return (
      typeof data === "object" && data !== null && (data as { is_admin?: unknown }).is_admin === true
    );
  } catch (err) {
    console.error("[admin-guard] profile lookup failed:", err);
    return false;
  }
}

/**
 * Authorization predicate shared by the admin API routes and the /admin page:
 * an admin is anyone in ADMIN_EMAILS OR with `profiles.is_admin = true`. Keeping
 * this in one place ensures the page gate and the API gate never drift apart.
 */
export async function isAuthorizedAdmin(user: User): Promise<boolean> {
  return isAdminEmail(user.email) || (await profileIsAdmin(user.id));
}

export async function requireAdmin(): Promise<{ user: User } | Response> {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await isAuthorizedAdmin(user))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminConfigured()) {
    return Response.json(
      { error: "Admin data layer not configured (SUPABASE_SERVICE_ROLE_KEY is unset)." },
      { status: 503 },
    );
  }

  return { user };
}

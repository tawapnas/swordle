// GET /api/admin/overview
//   → 200 AdminOverview  (cross-user aggregates for the bootcamp organizer)
//   → 401 if not signed in
//   → 403 if signed in but not an admin
//   → 503 if the service-role key isn't configured
//   → 500 on error

import type { AdminOverview } from "@/lib/account";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminOverview } from "@/lib/account-data";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const gate = await requireAdmin();
  if (gate instanceof Response) return gate;

  try {
    const overview: AdminOverview = await getAdminOverview();
    return Response.json(overview);
  } catch (err) {
    console.error("[api/admin/overview] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/me/profile — save the onboarding fields (name, optional team, school)
// to the signed-in user's profile.
//   body: { firstName: string, lastName: string, teamName?: string | null, school: string }
//   → 200 { ok: true }
//   → 400 malformed body  ·  401 not signed in  ·  500 internal error

import type { ProfileForm } from "@/lib/account";
import { getSessionUser } from "@/lib/supabase/server";
import { saveProfile } from "@/lib/account-data";

export const dynamic = "force-dynamic";

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBody(body: unknown): ProfileForm | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (!nonEmptyString(b.firstName)) return null;
  if (!nonEmptyString(b.lastName)) return null;
  if (!nonEmptyString(b.school)) return null;
  if (b.teamName != null && typeof b.teamName !== "string") return null;
  return {
    firstName: b.firstName,
    lastName: b.lastName,
    school: b.school,
    teamName: typeof b.teamName === "string" ? b.teamName : null,
  };
}

export async function POST(req: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const form = parseBody(raw);
  if (!form) {
    return Response.json(
      { error: "Body must be { firstName, lastName, school, teamName? }" },
      { status: 400 },
    );
  }

  try {
    await saveProfile(user, form);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/me/profile] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

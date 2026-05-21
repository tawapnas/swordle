// POST /api/me/profile — save the onboarding fields (username, province,
// optional educational institution) to the signed-in user's profile.
//   body: { username: string, province: string, educationalInstitution?: string | null }
//   → 200 { ok: true }
//   → 400 malformed body  ·  401 not signed in
//   → 409 { error: "username-taken" }  ·  500 internal error

import type { ProfileForm } from "@/lib/account";
import { getSessionUser } from "@/lib/supabase/server";
import { saveProfile } from "@/lib/account-data";
import { isValidProvince } from "@/lib/thailand-provinces";

export const dynamic = "force-dynamic";

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;

function parseBody(body: unknown): ProfileForm | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.username !== "string") return null;
  const username = b.username.trim();
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) return null;

  if (!isValidProvince(b.province)) return null;

  if (b.educationalInstitution != null && typeof b.educationalInstitution !== "string") {
    return null;
  }
  const institution =
    typeof b.educationalInstitution === "string"
      ? b.educationalInstitution.trim()
      : "";

  return {
    username,
    province: b.province,
    educationalInstitution: institution || null,
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
      { error: "Body must be { username, province, educationalInstitution? }" },
      { status: 400 },
    );
  }

  try {
    const result = await saveProfile(user, form);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 409 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/me/profile] failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

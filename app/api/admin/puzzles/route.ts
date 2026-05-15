// /api/admin/puzzles — manage the puzzle bank. Admin only (see lib/admin-guard).
//
//   GET                      → 200 { puzzles: Puzzle[] }   (includes answers)
//   POST  body: Puzzle       → 201 { puzzle: Puzzle }
//                              400 { errors: string[] } on a bad shape
//                              409 { error } if the id already exists
//   DELETE ?id=<id>          → 200 { ok: true } · 404 if no such puzzle
//
//   401 / 403 / 503 from requireAdmin; 500 on internal error.

import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { parsePuzzleInput } from "@/lib/puzzle-schema";
import { createPuzzle, deletePuzzle, listAllPuzzles } from "@/lib/puzzle-admin";

export const dynamic = "force-dynamic";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function GET(): Promise<Response> {
  const gate = await requireAdmin();
  if (gate instanceof Response) return gate;
  try {
    const puzzles = await listAllPuzzles();
    return Response.json({ puzzles });
  } catch (err) {
    console.error("[api/admin/puzzles] GET failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const gate = await requireAdmin();
  if (gate instanceof Response) return gate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Auto-generate an id when the form leaves it blank.
  if (isRecord(body) && !body.id && typeof body.type === "string") {
    body = { ...body, id: `${body.type}-${Date.now()}` };
  }

  const parsed = parsePuzzleInput(body);
  if (!parsed.ok) {
    return Response.json({ errors: parsed.errors }, { status: 400 });
  }

  try {
    await createPuzzle(parsed.puzzle);
    return Response.json({ puzzle: parsed.puzzle }, { status: 201 });
  } catch (err) {
    if (isRecord(err) && err.code === "23505") {
      return Response.json({ error: "A puzzle with that id already exists." }, { status: 409 });
    }
    console.error("[api/admin/puzzles] POST failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const gate = await requireAdmin();
  if (gate instanceof Response) return gate;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing ?id=" }, { status: 400 });
  }

  try {
    const deleted = await deletePuzzle(id);
    if (!deleted) {
      return Response.json({ error: "Puzzle not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/puzzles] DELETE failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// /api/admin/puzzles — manage the puzzle bank. Admin only (see lib/admin-guard).
//
//   GET                      → 200 { puzzles: Puzzle[] }   (includes answers)
//   POST  body: Puzzle       → 201 { puzzle: Puzzle }
//         (optional `position?: number` — a 1-based day slot to schedule it at;
//          omitted/out-of-range appends to the end of the schedule)
//                              400 { errors: string[] } on a bad shape
//                              400 { error } if `position` is not a positive int
//                              409 { error } if the id already exists
//   PUT   body: Puzzle       → 200 { puzzle: Puzzle }
//                              400 { errors: string[] } on a bad shape
//                              404 if no puzzle with that id
//   PATCH body: { order: string[] }  → 200 { ok: true }
//         (full list of puzzle ids in the desired schedule order)
//                              400 { error } if `order` is not a string array
//   DELETE ?id=<id>          → 200 { ok: true } · 404 if no such puzzle
//
//   401 / 403 / 503 from requireAdmin; 500 on internal error.

import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { parsePuzzleInput } from "@/lib/puzzle-schema";
import {
  createPuzzle,
  deletePuzzle,
  listAllPuzzles,
  reorderPuzzles,
  updatePuzzle,
} from "@/lib/puzzle-admin";

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

  // Optional 1-based day slot. `parsePuzzleInput` rebuilds the puzzle
  // field-by-field, so a stray `position` key on the body is harmless to it.
  let position: number | undefined;
  if (isRecord(body) && body.position !== undefined) {
    if (
      typeof body.position !== "number" ||
      !Number.isInteger(body.position) ||
      body.position < 1
    ) {
      return Response.json(
        { error: "`position` must be a positive integer." },
        { status: 400 },
      );
    }
    position = body.position;
  }

  try {
    await createPuzzle(parsed.puzzle, position);
    return Response.json({ puzzle: parsed.puzzle }, { status: 201 });
  } catch (err) {
    if (isRecord(err) && err.code === "23505") {
      return Response.json({ error: "A puzzle with that id already exists." }, { status: 409 });
    }
    console.error("[api/admin/puzzles] POST failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest): Promise<Response> {
  const gate = await requireAdmin();
  if (gate instanceof Response) return gate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parsePuzzleInput(body);
  if (!parsed.ok) {
    return Response.json({ errors: parsed.errors }, { status: 400 });
  }

  try {
    const updated = await updatePuzzle(parsed.puzzle);
    if (!updated) {
      return Response.json({ error: "Puzzle not found" }, { status: 404 });
    }
    return Response.json({ puzzle: parsed.puzzle });
  } catch (err) {
    console.error("[api/admin/puzzles] PUT failed:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const gate = await requireAdmin();
  if (gate instanceof Response) return gate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    !Array.isArray(body.order) ||
    !body.order.every((id) => typeof id === "string")
  ) {
    return Response.json(
      { error: "`order` must be an array of puzzle id strings." },
      { status: 400 },
    );
  }

  try {
    await reorderPuzzles(body.order);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/puzzles] PATCH failed:", err);
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

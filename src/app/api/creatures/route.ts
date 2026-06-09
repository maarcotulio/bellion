import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createCreature, listCreatures } from "@/lib/creatures/repository";
import { formatZodIssues, normalizeCreatureInput } from "@/lib/creatures/validation";

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const creatures = await listCreatures({
    search: searchParams.get("search") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    cr: searchParams.get("cr") ?? undefined,
  });

  return NextResponse.json({ creatures });
}

export async function POST(request: NextRequest) {
  try {
    const input: unknown = await request.json();
    const creature = normalizeCreatureInput(input);
    const createdCreature = await createCreature(creature);

    return NextResponse.json({ creature: createdCreature }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return jsonError("Creature payload is invalid.", 422, formatZodIssues(error));
    }

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return jsonError("A creature with this id already exists.", 409);
    }

    return jsonError("Unable to create creature.", 500);
  }
}

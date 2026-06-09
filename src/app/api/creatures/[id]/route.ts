import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  deleteCreature,
  getCreature,
  updateCreature,
} from "@/lib/creatures/repository";
import { formatZodIssues, normalizeCreatureUpdate } from "@/lib/creatures/validation";

type RouteContext = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const creature = await getCreature(id);

  if (!creature) {
    return jsonError("Creature not found.", 404);
  }

  return NextResponse.json({ creature });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const input: unknown = await request.json();
    const creature = normalizeCreatureUpdate(id, input);
    const updatedCreature = await updateCreature(id, creature);

    if (!updatedCreature) {
      return jsonError("Creature not found.", 404);
    }

    return NextResponse.json({ creature: updatedCreature });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return jsonError("Creature payload is invalid.", 422, formatZodIssues(error));
    }

    return jsonError("Unable to update creature.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteCreature(id);

  if (!deleted) {
    return jsonError("Creature not found.", 404);
  }

  return NextResponse.json({ deleted: true });
}

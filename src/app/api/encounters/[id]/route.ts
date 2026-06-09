import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  deleteEncounter,
  getEncounter,
  updateEncounter,
} from "@/lib/encounters/repository";
import {
  formatEncounterZodIssues,
  normalizeEncounterUpdate,
} from "@/lib/encounters/validation";

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
  const encounter = await getEncounter(id);

  if (!encounter) {
    return jsonError("Encounter not found.", 404);
  }

  return NextResponse.json({ encounter });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const input: unknown = await request.json();
    const encounter = normalizeEncounterUpdate(id, input);
    const updatedEncounter = await updateEncounter(id, encounter);

    if (!updatedEncounter) {
      return jsonError("Encounter not found.", 404);
    }

    return NextResponse.json({ encounter: updatedEncounter });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return jsonError("Encounter payload is invalid.", 422, formatEncounterZodIssues(error));
    }

    return jsonError("Unable to update encounter.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteEncounter(id);

  if (!deleted) {
    return jsonError("Encounter not found.", 404);
  }

  return NextResponse.json({ deleted: true });
}

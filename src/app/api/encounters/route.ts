import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createEncounter, listEncounters } from "@/lib/encounters/repository";
import {
  formatEncounterZodIssues,
  normalizeEncounterInput,
} from "@/lib/encounters/validation";

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function GET() {
  const encounters = await listEncounters();

  return NextResponse.json({ encounters });
}

export async function POST(request: NextRequest) {
  try {
    const input: unknown = await request.json();
    const encounter = normalizeEncounterInput(input);
    const createdEncounter = await createEncounter(encounter);

    return NextResponse.json({ encounter: createdEncounter }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return jsonError("Encounter payload is invalid.", 422, formatEncounterZodIssues(error));
    }

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return jsonError("An encounter with this id already exists.", 409);
    }

    return jsonError("Unable to create encounter.", 500);
  }
}

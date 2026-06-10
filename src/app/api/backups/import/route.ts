import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  formatBackupZodIssues,
  importRoyalBellionBackup,
} from "@/lib/backups/repository";

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const input: unknown = await request.json();
    const imported = await importRoyalBellionBackup(input);

    return NextResponse.json({ imported });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return jsonError("Backup payload is invalid.", 422, formatBackupZodIssues(error));
    }

    return jsonError("Unable to import backup.", 500);
  }
}

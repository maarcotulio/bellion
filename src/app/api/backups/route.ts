import { NextResponse } from "next/server";

import { exportRoyalBellionBackup } from "@/lib/backups/repository";

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function GET() {
  const backup = await exportRoyalBellionBackup();

  return NextResponse.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="royal-bellion-backup-${timestampForFilename()}.json"`,
    },
  });
}

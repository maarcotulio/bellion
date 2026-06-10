"use client";

import { Download, Upload } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ImportResponse = {
  readonly imported: {
    readonly creatures: {
      readonly matched: number;
      readonly modified: number;
      readonly upserted: number;
    };
    readonly encounters: {
      readonly matched: number;
      readonly modified: number;
      readonly upserted: number;
    };
  };
};

function isImportResponse(value: unknown): value is ImportResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "imported" in value &&
    typeof value.imported === "object" &&
    value.imported !== null
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BackupControls() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleExport() {
    setMessage(null);
    setError(null);
    setIsExporting(true);

    try {
      const response = await fetch("/api/backups");

      if (!response.ok) {
        throw new Error("Backup could not be exported.");
      }

      const blob = await response.blob();
      const filename = `royal-bellion-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      downloadBlob(blob, filename);
      setMessage("DB backup exported.");
    } catch (exportError: unknown) {
      setError(exportError instanceof Error ? exportError.message : "Backup could not be exported.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage(null);
    setError(null);
    setIsImporting(true);

    try {
      const parsed: unknown = JSON.parse(await file.text());
      const response = await fetch("/api/backups/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Backup could not be imported.");
      }

      if (!isImportResponse(data)) {
        throw new Error("Backup import response was invalid.");
      }

      setMessage(
        `Imported ${data.imported.creatures.upserted} new creatures, ${data.imported.creatures.modified} updated creatures, ${data.imported.encounters.upserted} new encounters, ${data.imported.encounters.modified} updated encounters.`,
      );
    } catch (importError: unknown) {
      setError(importError instanceof Error ? importError.message : "Backup could not be imported.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={handleExport} disabled={isExporting}>
          <Download aria-hidden="true" />
          {isExporting ? "Exporting" : "Export DB"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={isImporting}
        >
          <Upload aria-hidden="true" />
          {isImporting ? "Importing" : "Import DB"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleImport}
      />
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

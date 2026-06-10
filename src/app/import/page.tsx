"use client";

import { Check, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import { z } from "zod";

import { BackLink } from "@/components/layout/back-link";
import { Button } from "@/components/ui/button";
import { formatZodIssues, normalizeCreatureInput } from "@/lib/creatures/validation";
import type { Creature } from "@/lib/schemas/creature";

type ImportIssue = {
  readonly path: string;
  readonly message: string;
};

type ImportState =
  | { readonly status: "idle"; readonly issues: readonly ImportIssue[]; readonly creature: null }
  | {
      readonly status: "valid";
      readonly issues: readonly ImportIssue[];
      readonly creature: Creature;
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly ImportIssue[];
      readonly creature: null;
    };

type ApiCreatureResponse = {
  readonly creature: Creature;
};

const initialJson = `{
  "name": "Imported Creature",
  "size": "medium",
  "type": "humanoid",
  "alignment": "unaligned",
  "cr": "1/4",
  "ac": { "value": 12 },
  "hp": { "average": 9, "formula": "2d8" },
  "speed": { "walk": 30 },
  "stats": { "str": 10, "dex": 12, "con": 10, "int": 10, "wis": 10, "cha": 10 },
  "senses": ["passive Perception 10"],
  "languages": [],
  "traits": [],
  "actions": [{ "name": "Strike", "description": "Basic attack." }]
}`;

function isApiCreatureResponse(value: unknown): value is ApiCreatureResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "creature" in value &&
    typeof value.creature === "object" &&
    value.creature !== null
  );
}

function validateJson(text: string): ImportState {
  try {
    const parsed: unknown = JSON.parse(text);
    const creature = normalizeCreatureInput({
      ...(typeof parsed === "object" && parsed !== null ? parsed : {}),
      source: "import",
      importedAt: new Date().toISOString(),
    });

    return { status: "valid", issues: [], creature };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { status: "invalid", issues: formatZodIssues(error), creature: null };
    }

    const message = error instanceof Error ? error.message : "Invalid JSON.";

    return {
      status: "invalid",
      issues: [{ path: "<json>", message }],
      creature: null,
    };
  }
}

export default function ImportPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState(initialJson);
  const [state, setState] = useState<ImportState>({
    status: "idle",
    issues: [],
    creature: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleValidate() {
    setSaveError(null);
    setState(validateJson(jsonText));
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setJsonText(text);
    setSaveError(null);
    setState(validateJson(text));
  }

  async function handleSave() {
    if (state.status !== "valid") {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/creatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.creature),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Imported creature could not be saved.");
      }

      if (!isApiCreatureResponse(data)) {
        throw new Error("Import response was invalid.");
      }

      router.push(`/creatures/${data.creature.id}`);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Imported creature could not be saved.";

      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <BackLink href="/library" label="Back to library" />
        <div className="mt-4 flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
              JSON Import
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              Import Creature
            </h1>
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
            <Upload className="size-4" aria-hidden="true" />
            Upload JSON
            <input type="file" accept="application/json,.json" hidden onChange={handleFileChange} />
          </label>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="grid gap-4 rounded-lg border border-border bg-card/75 p-5">
            <textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              rows={28}
              className="field-input min-h-[36rem] py-4 font-mono text-sm leading-6"
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleValidate}>
                <Check aria-hidden="true" />
                Validate
              </Button>
            </div>
          </section>

          <aside className="grid content-start gap-4">
            {state.status === "valid" ? (
              <section className="rounded-lg border border-border bg-card/75 p-5">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
                  Preview
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold">
                  {state.creature.name}
                </h2>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="font-mono text-muted-foreground">Type</dt>
                    <dd className="mt-1 capitalize">{state.creature.type}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-muted-foreground">CR</dt>
                    <dd className="mt-1">{state.creature.cr}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-muted-foreground">HP</dt>
                    <dd className="mt-1">{state.creature.hp.average}</dd>
                  </div>
                </dl>
                <Button
                  type="button"
                  className="mt-6 w-full"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Upload aria-hidden="true" />
                  {isSaving ? "Saving" : "Save import"}
                </Button>
              </section>
            ) : null}

            {state.status === "invalid" ? (
              <section className="rounded-lg border border-destructive bg-destructive/10 p-5">
                <p className="font-display text-2xl font-semibold">Validation errors</p>
                <ul className="mt-4 grid gap-3 text-sm">
                  {state.issues.map((issue) => (
                    <li key={`${issue.path}-${issue.message}`}>
                      <span className="font-mono text-accent">{issue.path}</span>: {issue.message}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {saveError ? (
              <section className="rounded-lg border border-destructive bg-destructive/10 p-5 text-sm">
                {saveError}
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}

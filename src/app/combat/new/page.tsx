import Link from "next/link";

import { EncounterForm } from "@/components/combat/encounter-form";
import { listCreatures } from "@/lib/creatures/repository";

export const dynamic = "force-dynamic";

export default async function NewEncounterPage() {
  const creatures = await listCreatures();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <Link href="/combat" className="font-mono text-sm text-primary hover:text-accent">
          Back to encounters
        </Link>
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.18em] text-primary">
          Encounter Builder
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          New Encounter
        </h1>
        <div className="mt-8">
          <EncounterForm creatures={creatures} />
        </div>
      </section>
    </main>
  );
}

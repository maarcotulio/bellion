import { notFound } from "next/navigation";

import { EncounterTable } from "@/components/combat/encounter-table";
import { BackLink } from "@/components/layout/back-link";
import { listCreatures } from "@/lib/creatures/repository";
import { getEncounter } from "@/lib/encounters/repository";

export const dynamic = "force-dynamic";

type EncounterPageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function EncounterPage({ params }: EncounterPageProps) {
  const { id } = await params;
  const [encounter, creatures] = await Promise.all([getEncounter(id), listCreatures()]);

  if (!encounter) {
    notFound();
  }

  return (
    <main className="min-h-screen arcane-page text-foreground">
      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
        <BackLink href="/combat" label="Back to encounters" />
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.18em] text-primary">
          Encounter
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          {encounter.name}
        </h1>
        <div className="mt-8">
          <EncounterTable initialEncounter={encounter} creatures={creatures} />
        </div>
      </section>
    </main>
  );
}

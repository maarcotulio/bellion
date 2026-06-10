import { Plus, Shield, Swords } from "lucide-react";
import Link from "next/link";

import { BackLink } from "@/components/layout/back-link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listEncounters } from "@/lib/encounters/repository";

export const dynamic = "force-dynamic";

export default async function CombatPage() {
  const encounters = await listEncounters();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <BackLink href="/" label="Back home" />
        <div className="mt-4 flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
              Encounters
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              Combat Table
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/combat/quick">
                <Swords aria-hidden="true" />
                Quick combat
              </Link>
            </Button>
            <Button asChild>
              <Link href="/combat/new">
                <Plus aria-hidden="true" />
                New encounter
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {encounters.length > 0 ? (
            encounters.map((encounter) => (
              <Link
                key={encounter.id}
                href={`/combat/${encounter.id}`}
                className="arcane-panel rounded-lg border border-border bg-card/75 p-5 transition-colors hover:border-primary"
              >
                <h2 className="font-display text-2xl font-semibold">{encounter.name}</h2>
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                  {encounter.combatants.length} combatants · Target {encounter.target.name} HP{" "}
                  {encounter.target.currentHp}/{encounter.target.maxHp}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState
              icon={Shield}
              title="No encounters yet"
              description="Build a monster party or try quick combat for a single attacker."
            >
              <Button asChild>
                <Link href="/combat/new">
                  <Plus aria-hidden="true" />
                  New encounter
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/combat/quick">
                  <Swords aria-hidden="true" />
                  Quick combat
                </Link>
              </Button>
            </EmptyState>
          )}
        </div>
      </section>
    </main>
  );
}

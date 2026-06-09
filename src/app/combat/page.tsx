import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { listEncounters } from "@/lib/encounters/repository";

export const dynamic = "force-dynamic";

export default async function CombatPage() {
  const encounters = await listEncounters();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
              Encounters
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              Combat Table
            </h1>
          </div>
          <Button asChild>
            <Link href="/combat/new">
              <Plus aria-hidden="true" />
              New encounter
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4">
          {encounters.length > 0 ? (
            encounters.map((encounter) => (
              <Link
                key={encounter.id}
                href={`/combat/${encounter.id}`}
                className="rounded-lg border border-border bg-card/75 p-5 hover:border-primary"
              >
                <h2 className="font-display text-2xl font-semibold">{encounter.name}</h2>
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                  {encounter.combatants.length} combatants · Target {encounter.target.name} HP{" "}
                  {encounter.target.currentHp}/{encounter.target.maxHp}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card/75 p-8">
              <p className="font-display text-2xl font-semibold">No encounters yet</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

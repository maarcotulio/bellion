import { Edit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteCreatureButton } from "@/components/creature/delete-creature-button";
import { BackLink } from "@/components/layout/back-link";
import { Button } from "@/components/ui/button";
import { getCreature } from "@/lib/creatures/repository";
import type { Creature, CreatureAction } from "@/lib/schemas/creature";

export const dynamic = "force-dynamic";

type CreatureDetailPageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

function formatList(values: readonly string[] | undefined) {
  if (!values || values.length === 0) {
    return "None";
  }

  return values.join(", ");
}

function formatRecord(values: Readonly<Record<string, number>> | undefined) {
  if (!values || Object.keys(values).length === 0) {
    return "None";
  }

  return Object.entries(values)
    .map(([name, modifier]) => `${name} ${modifier >= 0 ? "+" : ""}${modifier}`)
    .join(", ");
}

function ActionList({
  title,
  actions,
}: {
  readonly title: string;
  readonly actions: readonly CreatureAction[] | undefined;
}) {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border pt-5">
      <h2 className="font-display text-2xl font-semibold text-accent">{title}</h2>
      <div className="mt-4 grid gap-4">
        {actions.map((action) => (
          <article key={action.name}>
            <h3 className="font-semibold">{action.name}</h3>
            {action.description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.description}</p>
            ) : null}
            {action.damage ? (
              <p className="mt-2 font-mono text-sm text-primary">
                {action.damage.map((damage) => `${damage.dice} ${damage.type}`).join(", ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function StatBlock({ creature }: { readonly creature: Creature }) {
  return (
    <article className="rounded-lg border border-border bg-card/80 p-6 shadow-[0_0_36px_rgba(62,208,255,0.08)]">
      <div className="border-b border-border pb-5">
        <h1 className="font-display text-5xl font-semibold">{creature.name}</h1>
        <p className="mt-2 text-sm capitalize text-muted-foreground">
          {creature.size} {creature.type}, {creature.alignment}
        </p>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Armor Class" value={`${creature.ac.value}${creature.ac.type ? ` (${creature.ac.type})` : ""}`} />
        <Stat label="Hit Points" value={`${creature.hp.average} (${creature.hp.formula})`} />
        <Stat
          label="Speed"
          value={Object.entries(creature.speed)
            .map(([key, value]) => `${key} ${String(value)}`)
            .join(", ")}
        />
      </dl>

      <dl className="mt-6 grid grid-cols-3 gap-3 rounded-lg border border-border bg-background/70 p-4 sm:grid-cols-6">
        {Object.entries(creature.stats).map(([ability, score]) => (
          <div key={ability} className="text-center">
            <dt className="font-mono text-sm uppercase text-muted-foreground">{ability}</dt>
            <dd className="mt-1 text-2xl font-semibold">{score}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-3 text-sm">
        <InfoLine label="Saving Throws" value={formatRecord(creature.savingThrows)} />
        <InfoLine label="Skills" value={formatRecord(creature.skills)} />
        <InfoLine label="Damage Resistances" value={formatList(creature.damageResistances)} />
        <InfoLine label="Damage Immunities" value={formatList(creature.damageImmunities)} />
        <InfoLine label="Damage Vulnerabilities" value={formatList(creature.damageVulnerabilities)} />
        <InfoLine label="Condition Immunities" value={formatList(creature.conditionImmunities)} />
        <InfoLine label="Senses" value={formatList(creature.senses)} />
        <InfoLine label="Languages" value={formatList(creature.languages)} />
        <InfoLine label="Challenge" value={creature.cr} />
      </div>

      {creature.traits.length > 0 ? (
        <section className="mt-6 border-t border-border pt-5">
          <h2 className="font-display text-2xl font-semibold text-accent">Traits</h2>
          <div className="mt-4 grid gap-4">
            {creature.traits.map((trait) => (
              <article key={trait.name}>
                <h3 className="font-semibold">{trait.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {trait.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6">
        <ActionList title="Actions" actions={creature.actions} />
        <ActionList title="Bonus Actions" actions={creature.bonusActions} />
        <ActionList title="Reactions" actions={creature.reactions} />
      </div>
    </article>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="font-mono text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg">{value}</dd>
    </div>
  );
}

function InfoLine({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <p>
      <span className="font-semibold text-accent">{label}.</span>{" "}
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
}

export default async function CreatureDetailPage({ params }: CreatureDetailPageProps) {
  const { id } = await params;
  const creature = await getCreature(id);

  if (!creature) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BackLink href="/library" label="Back to library" />
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={`/creatures/${creature.id}/edit`}>
                <Edit aria-hidden="true" />
                Edit
              </Link>
            </Button>
            <DeleteCreatureButton creatureId={creature.id} />
          </div>
        </div>
        <StatBlock creature={creature} />
      </section>
    </main>
  );
}

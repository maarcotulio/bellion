import { notFound } from "next/navigation";

import { CreatureForm } from "@/components/creature/creature-form";
import { BackLink } from "@/components/layout/back-link";
import { getCreature } from "@/lib/creatures/repository";

export const dynamic = "force-dynamic";

type EditCreaturePageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function EditCreaturePage({ params }: EditCreaturePageProps) {
  const { id } = await params;
  const creature = await getCreature(id);

  if (!creature) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-8">
        <BackLink href={`/creatures/${creature.id}`} label="Back to creature" />
        <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          Edit {creature.name}
        </h1>
        <div className="mt-8">
          <CreatureForm mode="edit" creature={creature} />
        </div>
      </section>
    </main>
  );
}

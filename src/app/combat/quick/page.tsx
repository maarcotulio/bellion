import { BackLink } from "@/components/layout/back-link";
import { QuickCombat } from "@/components/combat/quick-combat";
import { listCreatures } from "@/lib/creatures/repository";

export const dynamic = "force-dynamic";

export default async function QuickCombatPage() {
  const creatures = await listCreatures();

  return (
    <main className="min-h-screen arcane-page text-foreground">
      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
        <BackLink href="/" label="Back home" />
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.18em] text-primary">
          Quick Combat
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          One Attacker vs One Target
        </h1>
        <div className="mt-8">
          <QuickCombat creatures={creatures} />
        </div>
      </section>
    </main>
  );
}

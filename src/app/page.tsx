import { BookOpen, Dices, ScrollText, Shield, Swords } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const foundationItems = [
  {
    icon: BookOpen,
    label: "Creature Library",
    value: "Ready for M1",
  },
  {
    icon: Dices,
    label: "Dice Engine",
    value: "Planned",
  },
  {
    icon: Shield,
    label: "Combat Table",
    value: "Queued",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
            M0 Foundation
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-balance sm:text-7xl">
            Bellion
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            An arcane terminal for managing D&D 5e creatures, encounters, and combat
            rolls from a typed Next.js foundation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/library">
                <ScrollText aria-hidden="true" />
                Open library
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dice">
                <Dices aria-hidden="true" />
                Dice sandbox
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/combat/quick">
                <Swords aria-hidden="true" />
                Quick combat
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {foundationItems.map((item) => (
            <article
              key={item.label}
              className="border-border/80 bg-card/80 rounded-lg border p-5 shadow-[0_0_32px_rgba(62,208,255,0.08)]"
            >
              <item.icon className="size-5 text-primary" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold">{item.label}</h2>
              <p className="mt-2 font-mono text-sm text-accent">{item.value}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

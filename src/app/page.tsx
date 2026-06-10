import { BookOpen, Dices, ScrollText, Swords, Upload } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const modules = [
  {
    icon: BookOpen,
    label: "Creature Library",
    description: "Browse, create, and import stat blocks.",
    href: "/library",
  },
  {
    icon: Dices,
    label: "Dice Engine",
    description: "Roll expressions with auditable breakdowns.",
    href: "/dice",
  },
  {
    icon: Swords,
    label: "Combat Table",
    description: "Run monster parties with combatant HP tracking.",
    href: "/combat",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen arcane-page text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
            Arcane Terminal
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-balance sm:text-7xl">
            Royal Bellion
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Manage D&D 5e creatures, import JSON stat blocks, and run monster combat with
            automatic dice rolls, HP tracking, and a full combat log.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/library">
                <ScrollText aria-hidden="true" />
                Open library
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/import">
                <Upload aria-hidden="true" />
                Import JSON
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
            <Button asChild variant="secondary">
              <Link href="/combat">
                <Swords aria-hidden="true" />
                Encounters
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {modules.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group rounded-lg border border-border bg-card/80 p-5 shadow-[0_0_32px_rgba(62,208,255,0.08)] transition-colors hover:border-primary"
            >
              <item.icon
                className="size-5 text-primary transition-colors group-hover:text-accent"
                aria-hidden="true"
              />
              <h2 className="mt-4 font-display text-xl font-semibold">{item.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

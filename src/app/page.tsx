import { BookOpen, Dices, Plus, ScrollText, Shield, Swords, Upload } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const modules = [
  {
    icon: BookOpen,
    label: "Creature Library",
    description: "Browse, create, and import stat blocks.",
    status: "Complete",
    href: "/library",
  },
  {
    icon: Dices,
    label: "Dice Engine",
    description: "Roll expressions with auditable breakdowns.",
    status: "Complete",
    href: "/dice",
  },
  {
    icon: Shield,
    label: "Combat Table",
    description: "Run monster parties with combatant HP tracking.",
    status: "Complete",
    href: "/combat",
  },
] as const;

const milestones = [
  { id: "M0", label: "Foundation", status: "done" },
  { id: "M1", label: "Creature library", status: "done" },
  { id: "M2", label: "Dice + quick combat", status: "done" },
  { id: "M3", label: "Encounters", status: "done" },
  { id: "M4", label: "Visual polish", status: "done" },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
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
                <Shield aria-hidden="true" />
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
              <p className="mt-4 font-mono text-sm text-primary">{item.status}</p>
            </Link>
          ))}
        </div>

        <section className="mt-10 rounded-lg border border-border bg-card/60 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
                Roadmap
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">M0 through M4 shipped</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Core creature, dice, encounter, and interface work is complete.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/creatures/new">
                <Plus aria-hidden="true" />
                New creature
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {milestones.map((milestone) => (
              <span
                key={milestone.id}
                className={
                  milestone.status === "done"
                    ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary"
                    : milestone.status === "next"
                      ? "rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent"
                      : "rounded-md border border-border bg-background px-3 py-1.5 font-mono text-xs text-muted-foreground"
                }
              >
                {milestone.id} {milestone.label}
              </span>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

import { BookOpen, Plus, Upload } from "lucide-react";
import Link from "next/link";

import { BackLink } from "@/components/layout/back-link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listCreatures } from "@/lib/creatures/repository";
import {
  ChallengeRatingSchema,
  CreatureTypeSchema,
  type Creature,
} from "@/lib/schemas/creature";

export const dynamic = "force-dynamic";

type LibraryPageProps = {
  readonly searchParams: Promise<{
    readonly search?: string;
    readonly type?: string;
    readonly cr?: string;
  }>;
};

function formatOptionalList(values: readonly string[] | undefined) {
  if (!values || values.length === 0) {
    return "None";
  }

  return values.join(", ");
}

function CreatureCard({ creature }: { readonly creature: Creature }) {
  return (
    <article className="arcane-panel rounded-lg border border-border bg-card/80 p-5 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/creatures/${creature.id}`}
            className="font-display text-2xl font-semibold hover:text-primary"
          >
            {creature.name}
          </Link>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {creature.size} {creature.type}, {creature.alignment}
          </p>
        </div>
        <div className="w-16 shrink-0 rounded-md border border-border bg-background px-3 py-2 text-center font-mono">
          <p className="text-xs text-muted-foreground">CR</p>
          <p className="text-lg text-accent">{creature.cr}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="font-mono text-muted-foreground">HP</dt>
          <dd className="mt-1 text-foreground">
            {creature.hp.average} ({creature.hp.formula})
          </dd>
        </div>
        <div>
          <dt className="font-mono text-muted-foreground">AC</dt>
          <dd className="mt-1 text-foreground">{creature.ac.value}</dd>
        </div>
        <div>
          <dt className="font-mono text-muted-foreground">Actions</dt>
          <dd className="mt-1 text-foreground">{creature.actions.length}</dd>
        </div>
      </dl>

      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
        {formatOptionalList(creature.senses)}
      </p>
    </article>
  );
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const filters = await searchParams;
  const creatures = await listCreatures(filters);

  return (
    <main className="min-h-screen arcane-page text-foreground">
      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
        <BackLink href="/" label="Back home" />
        <div className="mt-4 flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">
              Creature Library
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              Royal Bellion Archive
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/creatures/new">
                <Plus aria-hidden="true" />
                New creature
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/import">
                <Upload aria-hidden="true" />
                Import JSON
              </Link>
            </Button>
          </div>
        </div>

        <form className="mt-8 grid gap-3 rounded-lg border border-border bg-card/70 p-4 lg:grid-cols-[1fr_180px_140px_auto]">
          <label className="grid gap-2 text-sm">
            <span className="font-mono text-muted-foreground">Search</span>
            <input
              name="search"
              defaultValue={filters.search}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Name"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-mono text-muted-foreground">Type</span>
            <select
              name="type"
              defaultValue={filters.type}
              className="h-10 cursor-pointer rounded-md border border-input bg-background px-3 text-sm capitalize outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All</option>
              {CreatureTypeSchema.options.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-mono text-muted-foreground">CR</span>
            <select
              name="cr"
              defaultValue={filters.cr}
              className="h-10 cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All</option>
              {ChallengeRatingSchema.options.map((cr) => (
                <option key={cr} value={cr}>
                  {cr}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:items-end">
            <Button type="submit" className="w-full lg:w-auto">
              <BookOpen aria-hidden="true" />
              Filter
            </Button>
            <Button asChild variant="ghost" className="w-full lg:w-auto">
              <Link href="/library">Clear</Link>
            </Button>
          </div>
        </form>

        {creatures.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {creatures.map((creature) => (
              <CreatureCard key={creature.id} creature={creature} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No creatures found"
            description="Create a creature manually or import a Royal Bellion JSON stat block."
            className="mt-8"
          >
            <Button asChild>
              <Link href="/creatures/new">
                <Plus aria-hidden="true" />
                New creature
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/import">
                <Upload aria-hidden="true" />
                Import JSON
              </Link>
            </Button>
          </EmptyState>
        )}
      </section>
    </main>
  );
}

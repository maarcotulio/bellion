import { Skeleton } from "@/components/ui/skeleton";

export default function CombatLoading() {
  return (
    <main className="min-h-screen arcane-page text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-12 w-64" />
        <div className="mt-8 grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-12 w-72" />
        <div className="mt-8 grid gap-3 rounded-lg border border-border bg-card/70 p-4 lg:grid-cols-[1fr_180px_140px_auto]">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}

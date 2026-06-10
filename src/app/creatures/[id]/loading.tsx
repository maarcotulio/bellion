import { Skeleton } from "@/components/ui/skeleton";

export default function CreatureDetailLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 h-[36rem] rounded-lg" />
      </section>
    </main>
  );
}

import { BackLink } from "@/components/layout/back-link";
import { DiceSandbox } from "@/components/combat/dice-sandbox";

export default function DicePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <BackLink href="/" label="Back home" />
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.18em] text-primary">
          Dice Sandbox
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          Roll Audit
        </h1>
        <div className="mt-8">
          <DiceSandbox />
        </div>
      </section>
    </main>
  );
}

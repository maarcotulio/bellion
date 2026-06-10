"use client";

import { cn } from "@/lib/utils";

type CombatLogEntry = {
  readonly id: string;
  readonly text: string;
};

type CombatLogProps = {
  readonly entries: readonly CombatLogEntry[];
  readonly emptyMessage?: string;
  readonly className?: string;
};

export function CombatLog({
  entries,
  emptyMessage = "No rolls yet.",
  className,
}: CombatLogProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {entries.length > 0 ? (
        entries.map((entry, index) => (
          <p
            key={entry.id}
            className={cn(
              "rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm leading-6 text-muted-foreground",
              index === 0 && "animate-log-in border-primary/30 text-foreground",
            )}
          >
            {entry.text}
          </p>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

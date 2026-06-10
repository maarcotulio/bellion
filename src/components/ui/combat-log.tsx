"use client";

import { formatRollExpression } from "@/lib/dice";
import type { CombatLogEntry } from "@/lib/schemas/encounter";
import { cn } from "@/lib/utils";

type RollAuditCardProps = {
  readonly toHit?: CombatLogEntry["toHit"];
  readonly damage?: CombatLogEntry["damage"];
  readonly title?: string;
  readonly subtitle?: string;
  readonly className?: string;
};

type CombatLogProps = {
  readonly entries: readonly CombatLogEntry[];
  readonly emptyMessage?: string;
  readonly className?: string;
};

export function RollAuditCard({
  toHit,
  damage,
  title,
  subtitle,
  className,
}: RollAuditCardProps) {
  return (
    <article
      className={cn(
        "rounded-md border border-border/70 bg-neutral-800/80 p-3 font-mono text-sm text-neutral-200 shadow-[0_0_24px_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      {title ? <p className="mb-1 text-xs text-muted-foreground">{title}</p> : null}
      {subtitle ? <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p> : null}

      {toHit ? (
        <div className="grid gap-1">
          <p className="font-semibold text-neutral-100">To Hit</p>
          <p className="text-neutral-300">{formatRollExpression(toHit)}</p>
          <p className="font-semibold text-neutral-100">{toHit.total}</p>
        </div>
      ) : null}

      {damage ? (
        <div className={cn("grid gap-1", toHit && "mt-4")}>
          <p className="font-semibold text-neutral-100">Damage</p>
          <p className="text-neutral-300">{formatRollExpression(damage)}</p>
          <p className="font-semibold text-neutral-100">
            {damage.type === "total" ? `${damage.total} total` : `${damage.total} ${damage.type} damage`}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function CombatLog({
  entries,
  emptyMessage = "No rolls yet.",
  className,
}: CombatLogProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {entries.length > 0 ? (
        entries.map((entry, index) => (
          <RollAuditCard
            key={entry.id}
            title={`${entry.attackerName} -> ${entry.targetName}`}
            subtitle={`${entry.actionName} · ${entry.outcome}`}
            toHit={entry.toHit}
            damage={entry.damage}
            className={cn(
              index === 0 && "animate-log-in border-primary/40",
            )}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

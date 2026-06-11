"use client";

import { formatRollExpression } from "@/lib/dice";
import type { CombatLogEntry } from "@/lib/schemas/encounter";
import { cn } from "@/lib/utils";

type RollAuditCardProps = {
  readonly toHit?: CombatLogEntry["toHit"];
  readonly damage?: CombatLogEntry["damage"];
  readonly outcome?: CombatLogEntry["outcome"];
  readonly showDamageTotal?: boolean;
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
  outcome,
  showDamageTotal = true,
  title,
  subtitle,
  className,
}: RollAuditCardProps) {
  const outcomeLabel = outcome ? `(${formatOutcome(outcome)})` : undefined;

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
          <p className="font-semibold text-neutral-100">
            To Hit{" "}
            {outcomeLabel ? (
              <span className="text-primary">{outcomeLabel}</span>
            ) : null}
          </p>
          <p className="text-neutral-300">{formatRollExpression(toHit)}</p>
          <p className="font-semibold text-neutral-100">{toHit.total}</p>
        </div>
      ) : null}

      {damage ? (
        <div className={cn("grid gap-1", toHit && "mt-4")}>
          <p className="font-semibold text-neutral-100">Damage</p>
          <p className="text-neutral-300">{formatRollExpression(damage)}</p>
          {showDamageTotal ? (
            <p className="font-semibold text-neutral-100">
              {damage.type === "total" ? `${damage.total} total` : `${damage.total} ${damage.type} damage`}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function formatOutcome(outcome: CombatLogEntry["outcome"]) {
  if (outcome === "fumble") {
    return "critical miss";
  }

  return outcome;
}

export function CombatLog({
  entries,
  emptyMessage = "No rolls yet.",
  className,
}: CombatLogProps) {
  const latestBatchId = entries.find((entry) => entry.batchId)?.batchId;
  const latestBatchEntries = latestBatchId
    ? entries.filter((entry) => entry.batchId === latestBatchId)
    : entries.slice(0, 1);
  const latestBatchHasTargetAc = latestBatchEntries.some((entry) => entry.targetAc !== undefined);
  const latestBatchDamageTotal = latestBatchEntries.reduce(
    (total, entry) => total + (entry.damage?.total ?? 0),
    0,
  );

  return (
    <div className={cn("grid gap-3", className)}>
      {latestBatchHasTargetAc ? (
        <div className="rounded-md border border-primary/50 bg-primary/10 px-4 py-3 font-mono text-sm text-primary">
          <span className="text-muted-foreground">Total Damage</span>{" "}
          <span className="font-semibold text-foreground">{latestBatchDamageTotal}</span>
        </div>
      ) : null}
      {entries.length > 0 ? (
        entries.map((entry, index) => (
          <RollAuditCard
            key={entry.id}
            title={`${entry.attackerName} -> ${entry.targetName}`}
            subtitle={`${entry.actionName} · ${formatOutcome(entry.outcome)}`}
            toHit={entry.toHit}
            damage={entry.damage}
            outcome={entry.outcome}
            showDamageTotal={entry.targetAc !== undefined}
            className={cn(
              (entry.batchId ? entry.batchId === latestBatchId : index === 0) &&
                "animate-log-in border-primary/70",
            )}
          />
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

"use client";

import { Dices } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { roll, rollD20, type D20Result, type RollResult } from "@/lib/dice";

type SandboxResult =
  | { readonly type: "dice"; readonly result: RollResult }
  | { readonly type: "d20"; readonly result: D20Result };

export function DiceSandbox() {
  const [expression, setExpression] = useState("2d6+3");
  const [modifier, setModifier] = useState(0);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRollDice() {
    setError(null);

    try {
      setResult({ type: "dice", result: roll(expression) });
    } catch (rollError: unknown) {
      const message = rollError instanceof Error ? rollError.message : "Roll failed.";

      setError(message);
    }
  }

  function handleRollD20() {
    setError(null);
    setResult({
      type: "d20",
      result: rollD20({ modifier, advantage, disadvantage }),
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="grid gap-5 rounded-lg border border-border bg-card/75 p-5">
        <label className="grid gap-2 text-sm">
          <span className="font-mono text-muted-foreground">Dice expression</span>
          <input
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            className="field-input"
          />
        </label>
        <Button type="button" onClick={handleRollDice}>
          <Dices aria-hidden="true" />
          Roll expression
        </Button>

        <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-3">
          <label className="grid gap-2 text-sm">
            <span className="font-mono text-muted-foreground">D20 modifier</span>
            <input
              type="number"
              value={modifier}
              onChange={(event) => setModifier(Number(event.target.value))}
              className="field-input"
            />
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={advantage}
              onChange={(event) => setAdvantage(event.target.checked)}
              className="size-4"
            />
            Advantage
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={disadvantage}
              onChange={(event) => setDisadvantage(event.target.checked)}
              className="size-4"
            />
            Disadvantage
          </label>
        </div>
        <Button type="button" variant="secondary" onClick={handleRollD20}>
          <Dices aria-hidden="true" />
          Roll d20
        </Button>
      </section>

      <aside className="rounded-lg border border-border bg-card/75 p-5">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Result</p>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        {result ? (
          <pre className="mt-4 overflow-auto rounded-md border border-border bg-background p-4 font-mono text-sm leading-6">
            {JSON.stringify(result.result, null, 2)}
          </pre>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No roll yet.</p>
        )}
      </aside>
    </div>
  );
}

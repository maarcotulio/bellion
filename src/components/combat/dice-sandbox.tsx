"use client";

import { Dices } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { RollAuditCard } from "@/components/ui/combat-log";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { roll, rollD20, type D20Result, type RollResult } from "@/lib/dice";
import { cn } from "@/lib/utils";

type SandboxResult =
  | { readonly type: "dice"; readonly result: RollResult }
  | { readonly type: "d20"; readonly result: D20Result };

export function DiceSandbox() {
  const [expression, setExpression] = useState("2d6+3");
  const [modifier, setModifier] = useState(0);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [outputMode, setOutputMode] = useState<"result" | "json">("result");
  const [error, setError] = useState<string | null>(null);
  const [rollKey, setRollKey] = useState(0);

  function handleRollDice() {
    setError(null);

    try {
      setResult({ type: "dice", result: roll(expression) });
      setRollKey((current) => current + 1);
    } catch (rollError: unknown) {
      const message = rollError instanceof Error ? rollError.message : "Roll failed.";

      setError(message);
      setResult(null);
    }
  }

  function handleRollD20() {
    setError(null);
    setResult({
      type: "d20",
      result: rollD20({ modifier, advantage, disadvantage }),
    });
    setRollKey((current) => current + 1);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Expression</p>
          <CardTitle>Roll Tools</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="dice-expression" className="font-mono text-muted-foreground">
              Dice expression
            </Label>
            <Input
              id="dice-expression"
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
            />
          </div>
          <Button type="button" onClick={handleRollDice}>
            <Dices aria-hidden="true" />
            Roll expression
          </Button>

          <div className="grid gap-4 border-t border-border pt-5 md:grid-cols-3 md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="d20-modifier" className="font-mono text-muted-foreground">
                D20 modifier
              </Label>
              <Input
                id="d20-modifier"
                type="number"
                value={modifier}
                onChange={(event) => setModifier(Number(event.target.value))}
              />
            </div>
            <CheckboxField
              id="sandbox-advantage"
              label="Advantage"
              checked={advantage}
              onCheckedChange={setAdvantage}
            />
            <CheckboxField
              id="sandbox-disadvantage"
              label="Disadvantage"
              checked={disadvantage}
              onCheckedChange={setDisadvantage}
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleRollD20}>
            <Dices aria-hidden="true" />
            Roll d20
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary">Result</p>
          <CardTitle>Audit Output</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SelectField label="Output" value={outputMode} onChange={(value) => setOutputMode(value as "result" | "json")}>
            <option value="result">Result</option>
            <option value="json">JSON</option>
          </SelectField>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {result && outputMode === "json" ? (
            <pre
              key={rollKey}
              className={cn(
                "overflow-auto rounded-md border border-border bg-background p-4 font-mono text-sm leading-6",
                "animate-dice-pop",
              )}
            >
              {JSON.stringify(result.result, null, 2)}
            </pre>
          ) : result?.type === "d20" ? (
            <RollAuditCard
              key={rollKey}
              title="D20 Roll"
              toHit={{
                expression: "1d20",
                rolls: [...result.result.rolls],
                modifier: result.result.modifier,
                total: result.result.total,
              }}
              className="animate-dice-pop"
            />
          ) : result?.type === "dice" ? (
            <RollAuditCard
              key={rollKey}
              title="Dice Roll"
              damage={{
                expression: result.result.expression,
                rolls: [...result.result.rolls],
                modifier: result.result.modifier,
                total: result.result.total,
                rawTotal: result.result.total,
                mode: "normal",
                type: "total",
              }}
              className="animate-dice-pop"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No roll yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

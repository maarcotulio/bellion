"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChallengeRatingSchema,
  CreatureSchema,
  CreatureSizeSchema,
  CreatureTypeSchema,
  type Creature,
} from "@/lib/schemas/creature";

type CreatureFormProps = {
  readonly mode: "create" | "edit";
  readonly creature?: Creature;
};

type ApiCreatureResponse = {
  readonly creature: Creature;
};

const defaultCreature: Creature = {
  id: "",
  name: "",
  size: "medium",
  type: "humanoid",
  alignment: "unaligned",
  cr: "0",
  ac: { value: 10 },
  hp: { average: 1, formula: "1d6" },
  speed: { walk: 30 },
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  senses: ["passive Perception 10"],
  languages: [],
  traits: [],
  actions: [{ name: "Strike", description: "Basic attack." }],
  source: "manual",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

function stringifyField(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseOptionalJson(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as unknown;
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readNumber(formData: FormData, key: string) {
  return Number(readString(formData, key));
}

function isApiCreatureResponse(value: unknown): value is ApiCreatureResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "creature" in value &&
    CreatureSchema.safeParse(value.creature).success
  );
}

export function CreatureForm({ mode, creature = defaultCreature }: CreatureFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const payload = {
        name: readString(formData, "name"),
        size: readString(formData, "size"),
        type: readString(formData, "type"),
        alignment: readString(formData, "alignment"),
        cr: readString(formData, "cr"),
        ac: {
          value: readNumber(formData, "ac.value"),
          type: readString(formData, "ac.type") || undefined,
        },
        hp: {
          average: readNumber(formData, "hp.average"),
          formula: readString(formData, "hp.formula"),
        },
        speed: parseOptionalJson(formData.get("speed")),
        stats: {
          str: readNumber(formData, "stats.str"),
          dex: readNumber(formData, "stats.dex"),
          con: readNumber(formData, "stats.con"),
          int: readNumber(formData, "stats.int"),
          wis: readNumber(formData, "stats.wis"),
          cha: readNumber(formData, "stats.cha"),
        },
        savingThrows: parseOptionalJson(formData.get("savingThrows")),
        skills: parseOptionalJson(formData.get("skills")),
        damageResistances: parseOptionalJson(formData.get("damageResistances")),
        damageImmunities: parseOptionalJson(formData.get("damageImmunities")),
        damageVulnerabilities: parseOptionalJson(formData.get("damageVulnerabilities")),
        conditionImmunities: parseOptionalJson(formData.get("conditionImmunities")),
        senses: parseOptionalJson(formData.get("senses")),
        languages: parseOptionalJson(formData.get("languages")),
        traits: parseOptionalJson(formData.get("traits")),
        actions: parseOptionalJson(formData.get("actions")),
        bonusActions: parseOptionalJson(formData.get("bonusActions")),
        reactions: parseOptionalJson(formData.get("reactions")),
        source: creature.source ?? "manual",
        importedAt: creature.importedAt,
        createdAt: creature.createdAt,
        updatedAt: creature.updatedAt,
      };

      const response = await fetch(
        mode === "create" ? "/api/creatures" : `/api/creatures/${creature.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Creature could not be saved.");
      }

      if (!isApiCreatureResponse(data)) {
        throw new Error("Creature response was invalid.");
      }

      router.push(`/creatures/${data.creature.id}`);
      router.refresh();
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : "Creature could not be saved.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input name="name" defaultValue={creature.name} required className="field-input" />
          </Field>
          <Field label="Size">
            <select name="size" defaultValue={creature.size} className="field-input capitalize">
              {CreatureSizeSchema.options.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select name="type" defaultValue={creature.type} className="field-input capitalize">
              {CreatureTypeSchema.options.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Alignment">
            <input
              name="alignment"
              defaultValue={creature.alignment}
              required
              className="field-input"
            />
          </Field>
          <Field label="Challenge Rating">
            <select name="cr" defaultValue={creature.cr} className="field-input">
              {ChallengeRatingSchema.options.map((cr) => (
                <option key={cr} value={cr}>
                  {cr}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Combat Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="AC">
            <input
              name="ac.value"
              type="number"
              min={1}
              defaultValue={creature.ac.value}
              required
              className="field-input"
            />
          </Field>
          <Field label="AC Type">
            <input name="ac.type" defaultValue={creature.ac.type} className="field-input" />
          </Field>
          <Field label="Average HP">
            <input
              name="hp.average"
              type="number"
              min={1}
              defaultValue={creature.hp.average}
              required
              className="field-input"
            />
          </Field>
          <Field label="HP Formula">
            <input
              name="hp.formula"
              defaultValue={creature.hp.formula}
              required
              className="field-input"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-6">
          {(["str", "dex", "con", "int", "wis", "cha"] as const).map((ability) => (
            <Field key={ability} label={ability.toUpperCase()}>
              <input
                name={`stats.${ability}`}
                type="number"
                min={1}
                max={30}
                defaultValue={creature.stats[ability]}
                required
                className="field-input"
              />
            </Field>
          ))}
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structured Fields</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <JsonField label="Speed" name="speed" value={creature.speed} />
          <JsonField label="Saving Throws" name="savingThrows" value={creature.savingThrows} />
          <JsonField label="Skills" name="skills" value={creature.skills} />
          <JsonField
            label="Damage Resistances"
            name="damageResistances"
            value={creature.damageResistances}
          />
          <JsonField
            label="Damage Immunities"
            name="damageImmunities"
            value={creature.damageImmunities}
          />
          <JsonField
            label="Damage Vulnerabilities"
            name="damageVulnerabilities"
            value={creature.damageVulnerabilities}
          />
          <JsonField
            label="Condition Immunities"
            name="conditionImmunities"
            value={creature.conditionImmunities}
          />
          <JsonField label="Senses" name="senses" value={creature.senses} />
          <JsonField label="Languages" name="languages" value={creature.languages} />
          <JsonField label="Traits" name="traits" value={creature.traits} rows={8} />
          <JsonField label="Actions" name="actions" value={creature.actions} rows={8} />
          <JsonField label="Bonus Actions" name="bonusActions" value={creature.bonusActions} />
          <JsonField label="Reactions" name="reactions" value={creature.reactions} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save aria-hidden="true" />
          {isSubmitting ? "Saving" : "Save creature"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-mono text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function JsonField({
  label,
  name,
  value,
  rows = 5,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: unknown;
  readonly rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        name={name}
        rows={rows}
        defaultValue={value === undefined ? "" : stringifyField(value)}
        className="field-input min-h-28 py-3 font-mono text-xs leading-5"
      />
    </Field>
  );
}

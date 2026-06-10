# Royal Bellion Schema

## Source of Truth

The canonical runtime schema lives in `src/lib/schemas/creature.ts` as `CreatureSchema`. Use Zod validation before accepting imported JSON or persisting creature data.

Fixtures live in `fixtures/creatures/` and are validated with:

```bash
pnpm validate:fixtures
```

## Creature Template

A creature is a reusable library template, not a combat instance.

```typescript
Creature {
  id: string
  name: string
  size: "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan"
  type: CreatureType
  alignment: string
  cr: ChallengeRating
  ac: { value: number; type?: string }
  hp: { average: number; formula: string }
  speed: {
    walk?: number
    burrow?: number
    climb?: number
    fly?: number
    swim?: number
    hover?: boolean
  }
  stats: { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  savingThrows?: Record<Ability, number>
  skills?: Record<string, number>
  damageResistances?: DamageType[]
  damageImmunities?: DamageType[]
  damageVulnerabilities?: DamageType[]
  conditionImmunities?: Condition[]
  senses: string[]
  languages: string[]
  traits: Trait[]
  actions: Action[]
  bonusActions?: Action[]
  reactions?: Action[]
  source?: "manual" | "import" | "fixture"
  importedAt?: string
  createdAt: string
  updatedAt: string
}
```

## Action

```typescript
Action {
  name: string
  description?: string
  attackBonus?: number
  reach?: number
  range?: string
  damage?: { dice: string; type: DamageType }[]
  saveDC?: number
  saveAbility?: Ability
}
```

Dice expressions currently support forms like `1d6`, `1d6+2`, and `7d10+21`.

## Encounter Model

Encounter persistence is planned for M3. The intended shape is:

```typescript
Encounter {
  id: string
  name: string
  createdAt: string
  combatants: Combatant[]
}

Combatant {
  creatureId: string
  instanceName: string
  currentHp: number
  maxHp: number
  tempHp?: number
  conditions: string[]
  initiative?: number
  isActive: boolean
}
```

## Fixture Examples

Current examples:

- `fixtures/creatures/goblin.json`
- `fixtures/creatures/owlbear.json`

Both fixtures must validate against `CreatureSchema`.

## Persistence Notes

- MongoDB stores the flexible JSON-like creature documents.
- Mongoose ODM mirrors the Zod schema for persistence behavior.
- Zod remains the input validation source of truth.

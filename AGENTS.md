# Royal Bellion Agent Guide

## Purpose

Royal Bellion is a Dungeon Master tool for D&D 5e creature management and monster combat. The app stores creature templates, imports JSON stat blocks, builds encounters, resolves dice rolls, updates hit points, and keeps combat output auditable.

## Stack

- Framework: Next.js 15 App Router.
- Language: TypeScript with strict checking.
- UI: Tailwind CSS and shadcn/ui conventions.
- Validation: Zod. Shared schemas are the source of truth.
- Database: MongoDB for local and production persistence.
- Mongo abstraction: Mongoose ODM. Do not call it an ORM.
- Package manager: pnpm.
- Local database: Docker Compose MongoDB.

## Commands

- `pnpm dev`: start the local Next.js dev server.
- `pnpm build`: build the production app.
- `pnpm start`: serve the production build.
- `pnpm lint`: run ESLint.
- `pnpm typecheck`: run TypeScript without emitting files.
- `pnpm validate:fixtures`: validate creature fixture JSON against `CreatureSchema`.
- `docker compose up -d`: start local MongoDB once `docker-compose.yml` exists.
- `docker compose down`: stop local MongoDB.

Run `pnpm lint`, `pnpm typecheck`, and relevant validation scripts before considering implementation work complete.

## Folder Rules

- `src/app/`: App Router pages, layouts, route handlers, and route-level loading/error UI.
- `src/components/ui/`: shadcn/ui base components and small reusable primitives.
- `src/components/creature/`: creature list, form, import preview, and stat block components.
- `src/components/combat/`: encounter table, combatant rows, action picker, HP bars, dice log, and combat controls.
- `src/lib/schemas/`: Zod schemas and inferred domain types.
- `src/lib/dice/`: dice parsing and rolling logic. This folder must not depend on React.
- `src/lib/combat/`: combat orchestration and 5e rule application.
- `src/lib/db/`: Mongoose connection helpers and models.
- `src/stores/`: client-side state stores.
- `fixtures/`: checked-in data used for validation, examples, and later seed flows.
- `scripts/`: project scripts that are meant to run from pnpm commands.
- `docs/`: canonical product, schema, and architecture documentation once M0 docs are split.

Keep route components thin. Put shared domain behavior in `src/lib/*` and reusable UI in `src/components/*`.

## Naming Conventions

- Use English for code names, file names, comments, and UI copy unless product copy explicitly changes.
- Use kebab-case for route segments and non-component file names: `validate-creature-fixtures.ts`.
- Use PascalCase for React components, Zod schemas, and exported domain types: `CreatureSchema`, `StatBlock`.
- Use camelCase for variables, functions, object fields, and JSON keys: `currentHp`, `attackBonus`.
- Name Zod schemas with a `Schema` suffix and export inferred types from the same file.
- Prefer explicit domain names over vague abbreviations: `combatant`, not `unit`; `creature`, not `mob`.

## TypeScript Rules

- Do not use `any`. Use `unknown`, discriminated unions, Zod inference, or precise interfaces.
- Keep `strict` TypeScript enabled.
- Validate untrusted JSON through Zod before using it as domain data.
- Export types from schemas with `z.infer`.
- Avoid broad casts. If a cast is needed, first narrow or validate the value.
- Keep server-only code out of client components.

## Domain Glossary

- Creature: a reusable monster template stored in the library, such as Goblin or Owlbear.
- Combatant: a creature instance placed into an encounter, with current HP, conditions, initiative, and a table-facing name.
- Encounter: a combat session containing combatants and future combat history.
- Action: an attack or active ability available to a creature.
- Trait: a passive feature on a creature.
- Dice expression: a string such as `2d6+3` parsed and resolved by the dice engine.
- Combat log: an auditable sequence of rolls and combat outcomes.
- Arcane Terminal: Royal Bellion's UI direction: dark fantasy, luminous interface panels, dense DM tooling, and readable combat telemetry.

## Implementation Rules

- Every dice roll must go through `src/lib/dice/`. Do not scatter `Math.random()` in components or route handlers.
- Zod schemas define accepted input and shared domain shape. Mongoose models should mirror them, not replace them.
- Combat components must not contain rules logic. Delegate rules to `src/lib/combat/`.
- Keep creature import behavior schema-first: parse JSON as `unknown`, validate with `CreatureSchema`, then render or persist.
- Keep API route handlers thin: validate input, call domain/db helpers, return typed responses.
- Prefer small, focused modules over large catch-all files.
- Add tests when implementing dice, combat, schema migration, or persistence behavior.

## Arcane Terminal UI Rules

- Build an operational tool first, not a landing page.
- Use a dark base: background `#080b12`, panels `#12182a`, subtle borders, and high-contrast foreground text.
- Use electric cyan for primary focus, aged gold for important secondary accents, and deep red for damage/destructive states.
- Use dramatic serif display type for major titles and geometric sans/mono type for stats, controls, and combat data.
- Keep layouts dense but legible: sidebars for parties, central space for target/action selection, and a bottom or side log for combat output.
- Use cards for repeated entities such as creatures or combatants, not as nested decorative containers.
- Use segmented HP bars with threshold color changes and clear numeric values.
- Use lucide icons for common actions when available.
- Avoid decorative-only visual noise that makes combat state harder to scan.
- Do not reference protected fantasy product identities in design names or copy.

## What To Avoid

- Do not overbuild full 5e automation during the MVP.
- Do not implement complex spellcasting or multi-target automation before the planned milestones.
- Do not put combat rules in React components.
- Do not add new state libraries or UI frameworks without a concrete need.
- Do not make root `Plan.md` canonical long-term; M0 docs should move canonical planning into `docs/`.
- Do not commit generated artifacts such as `.next/`, `node_modules/`, coverage output, logs, or `*.tsbuildinfo`.

# Bellion

Arcane terminal for D&D 5e creature management and monster combat. Bellion lets Dungeon Masters store creature templates, import JSON stat blocks, roll dice with auditable output, and run multi-monster encounters against a target.

## Status

| Milestone | Scope | Status |
|-----------|-------|--------|
| M0 | Foundation — Next.js, MongoDB, schemas, docs | Done |
| M1 | Creature library — CRUD, manual form, JSON import | Done |
| M2 | Dice engine — sandbox, quick combat, 5e rolls | Done |
| M3 | Encounters — monster parties, HP bars, round runner | Done |
| M4 | Visual polish — animations, responsive UX | Planned |
| M5 | Hardening — seed data, deploy, rate limiting | Planned |

## Features

- **Creature library** — search and filter by name, type, and CR
- **Manual creation** — full stat block form for custom creatures
- **JSON import** — validate, preview, and save Bellion-format stat blocks
- **Dice sandbox** — test expressions, d20 rolls, advantage, and disadvantage
- **Quick combat** — one attacker vs one target with resistance modes
- **Encounters** — build a monster party, select attackers and actions, run a full round with combat log and HP tracking

## Stack

- Next.js 15 (App Router)
- TypeScript
- MongoDB + Mongoose
- Zod
- Tailwind CSS + shadcn/ui
- Vitest

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local MongoDB)

### Setup

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm validate:mongo
pnpm validate:fixtures
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name |

See [`.env.example`](.env.example) for defaults.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run Vitest tests |
| `pnpm validate:mongo` | Verify MongoDB connectivity |
| `pnpm validate:fixtures` | Validate creature fixture JSON |

## Project structure

```
src/
├── app/              # Routes and API handlers
├── components/       # UI, creature, and combat components
└── lib/
    ├── schemas/      # Zod schemas
    ├── dice/         # Dice engine
    ├── combat/       # Combat orchestration
    └── db/           # Mongoose models
fixtures/             # Sample creature JSON
docs/                 # Roadmap, schema, architecture
```

## Documentation

- [AGENTS.md](AGENTS.md) — conventions for AI agents and contributors
- [docs/ROADMAP.md](docs/ROADMAP.md) — milestones and done criteria
- [docs/SCHEMA.md](docs/SCHEMA.md) — Bellion creature JSON schema
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module overview

## License

MIT

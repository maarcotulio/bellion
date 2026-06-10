# Royal Bellion Architecture

## Current Stack

```mermaid
flowchart TB
    Browser[Browser]
    App[Next.js App Router]
    UI[React Components]
    Schemas[Zod Schemas]
    DB[Mongoose ODM]
    Mongo[(MongoDB)]
    Fixtures[Creature Fixtures]

    Browser --> App
    App --> UI
    App --> Schemas
    App --> DB
    DB --> Mongo
    Fixtures --> Schemas
```

## Module Boundaries

- `src/app/`: route-level UI, layouts, and future API route handlers.
- `src/components/ui/`: shadcn/ui primitives and reusable UI building blocks.
- `src/components/creature/`: creature-specific UI.
- `src/components/combat/`: encounter and combat table UI.
- `src/lib/schemas/`: Zod schemas and inferred domain types.
- `src/lib/db/`: Mongoose connection and future models.
- `src/lib/dice/`: dice parser and roller. No React dependency.
- `src/lib/combat/`: combat rules and round orchestration. No React dependency.
- `fixtures/`: checked-in examples and seed-ready domain data.
- `scripts/`: command-line validation and maintenance scripts.

## Data Flow

```mermaid
sequenceDiagram
    participant DM as DM
    participant UI as Next UI
    participant API as Route Handler
    participant Schema as Zod
    participant Model as Mongoose
    participant Mongo as MongoDB

    DM->>UI: Submit creature JSON
    UI->>API: POST /api/creatures
    API->>Schema: CreatureSchema.safeParse(input)
    Schema-->>API: Typed creature
    API->>Model: Persist creature
    Model->>Mongo: Write document
    Mongo-->>Model: Stored document
    Model-->>API: Creature
    API-->>UI: Response
```

## Combat Flow

```mermaid
sequenceDiagram
    participant DM as DM
    participant UI as Combat UI
    participant Combat as Combat Engine
    participant Dice as Dice Engine

    DM->>UI: Select attackers, actions, and combatant targets
    DM->>UI: Run round
    loop Each attacker
        UI->>Combat: resolve attack
        Combat->>Dice: roll d20
        Dice-->>Combat: attack result
        alt Hit
            Combat->>Dice: roll damage
            Dice-->>Combat: damage result
            Combat-->>UI: HP update and log entry
        else Miss
            Combat-->>UI: miss log entry
        end
    end
    UI-->>DM: Updated HP bars and combat log
```

## Local Development

- Next.js runs with `pnpm dev`.
- MongoDB runs with `docker compose up -d`.
- The app connects through `MONGODB_URI`.
- `.env.example` documents the local default connection string.
- `pnpm validate:mongo` verifies the Mongoose connection.

## Design Boundary

Arcane Terminal is the UI direction:

- dense DM tooling
- dark background
- luminous borders
- cyan primary actions
- aged gold accents
- red damage states
- clear, scannable combat telemetry

Avoid making core app screens into marketing pages.

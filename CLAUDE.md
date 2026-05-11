# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

Pokopia Lab is a Pokémon home/build planning app. The core loop: pick Pokémon → see best-matching comfort items and favorites → build a complete item/material plan → track progress to completion. Ranking is explainable ("Best / Good / Some / None") with visible overlap reasons based on shared favorite categories and habitat overlap.

Key design goals:
- **Shared-first UI**: reusable components and tokens over one-off styling.
- **Explainable ranking**: match tiers with visible overlap reasons.
- **Fast interactions**: immediate feedback on toggles, sorts, and filters.
- **Practical polish**: consistent spacing, typography, controls, and loading skeletons.

## Commands

```bash
npm run dev          # Start dev server (Vite, localhost:5173)
npm run build        # Type-check + production build
npm test             # Run all tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run data:generate  # Regenerate src/data/generated/ from seed scripts
npm run assets:sync    # Sync Pokopia image assets
```

To run a single test file:
```bash
npx vitest run src/test/scoring.test.ts
```

## Architecture

### Feature-based structure under `src/`

- **`src/features/home-builder/`** — the primary feature. Contains `state/` (context + reducer) and `views/` (page components). This is the main planner flow.
- **`src/features/pokedex/`** — read-only browse pages for Pokémon, items, and habitats.
- **`src/features/saved-homes/`** — list/load/manage saved home builds.
- **`src/features/design-system/`** — live design system preview page at `/design-system`.
- **`src/components/`** — shared UI primitives organized by domain (`common/`, `home-builder/`, `items/`, `pokemon/`, `habitats/`). Prefer updating these over one-off local styles.

### Domain layer (`src/domain/`)

Pure logic, no React. Key sub-modules:

- **`home-builder/models.ts`** — all TypeScript types for builder state (`CurrentHomeState`, `SavedHome`, `RankedItem`, `RankedPokemon`, `SuggestionCardModel`, etc.)
- **`home-builder/logic.ts`** — ranking algorithms: `selectRankedItemsForCurrentHome`, `selectRankedPokemonForCurrentHome`, `selectRankedHabitatsForCurrentHome`, `selectSuggestionsForCurrentHome`, and `selectHomeCategoryStrengths`.
- **`home-builder/selectors.ts`** — filters and grouping on top of logic (used directly by views).
- **`home-builder/materialPlanning.ts`** — material aggregation, progress tracking, recipe breakdown.
- **`home-builder/entities.ts`** — singleton `entityStore` that maps raw generated data into `HomeBuilderPokemon`, `HomeBuilderItem`, `HomeBuilderHabitat` shapes.
- **`domain/types/index.ts`** — canonical domain types (re-exported via `src/lib/types.ts`).

### State management

All builder state flows through `HomeBuilderContext` (`src/features/home-builder/state/HomeBuilderContext.tsx`):
- `useReducer` with `homeBuilderReducer` for `currentHome`, `savedHomes`, `browse`, `ui`, and `session` slices.
- Auto-persists to `localStorage` via `localSessionAdapter` with 250ms debounce.
- Restore codes use `/api/session-export` and `/api/session-import/:code` — served by a Vite dev middleware and Netlify Functions in production.

### Data pipeline

Raw game data lives in `src/data/` (hand-authored `.ts` files). Running `npm run data:generate` executes scripts in `scripts/` and outputs type-safe files into **`src/data/generated/`** — these are checked in and consumed by `domain/home-builder/entities.ts`. Do not hand-edit generated files.

### Routing

React Router v7. The builder tabs (`/builder/pokemon`, `/builder/items/comfort`, `/builder/items/other`, `/builder/favorites`) are all rendered by a single `HomeBuilderPage` component; the active tab and filters are read from the URL path + search params via `builderSearchParams.ts`.

### Styling

Tailwind v4 (CSS-first config). All design tokens are CSS custom properties defined in `src/styles.css` under the `--pk-*` namespace (colors, spacing, radius, shadows, typography). Use these tokens and the shared component primitives — avoid one-off inline values. Score tiers use semantic token sets: `--pk-best-*`, `--pk-some-*`, `--pk-none-*`, `--pk-destructive-*`.

## Working Rules (from AGENTS.md)

When making a UI style/behavior change:
1. Check for an existing shared component, token, or global style first.
2. Prefer updating shared primitives over one-off inline classes.
3. Before a broad UI refactor, propose either a **shared update** (recommended) or a **local patch** (faster, less reusable), then proceed with the chosen path.

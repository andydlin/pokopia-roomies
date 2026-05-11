# Target Architecture

## Top-level principles
- One persistent Home Builder workspace.
- Multiple context-aware browsing surfaces.
- Pokedex exists separately for neutral browsing.
- Suggestions are advisory only.
- Local-first persistence with optional remote restore.

## Feature boundaries

### home-builder feature
Responsible for:
- current Home state
- saved homes CRUD
- expanded home view
- builder layout shell
- browse context state

### items-browser feature
Responsible for:
- item filters/search
- contextual item ranking
- item sections/view models

### pokemon-browser feature
Responsible for:
- contextual pokemon ranking
- pokemon filters/search
- pokemon browse sections

### habitats-browser feature
Responsible for:
- contextual habitat ranking
- habitat filters/search
- habitat browse sections

### pokedex feature
Responsible for:
- neutral browsing of pokemon/items/habitats
- detail-heavy exploration
- optional add-to-home affordances

### shared domain
Responsible for:
- data normalization
- domain models
- selectors
- suggestion/ranking logic

## Recommended folder layout

```text
src/
  app/
    App.tsx
    routes.tsx
  features/
    home-builder/
      components/
      state/
      views/
    items-browser/
      components/
      logic/
      selectors/
    pokemon-browser/
    habitats-browser/
    saved-homes/
    pokedex/
  domain/
    models/
    logic/
    selectors/
  data/
    generated/
    repositories/
  lib/
    storage/
    transport/
    routing/
```

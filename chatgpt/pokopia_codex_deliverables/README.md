# Pokopia Roommate Tool — Codex Deliverables

This package turns the design decisions from our chat into implementation-ready deliverables for Codex.

## Files

- `01_project_brief.md` — what the product is, what it should do, and MVP boundaries
- `02_data_model.md` — exact data model, including favorite categories and the items inside each category
- `03_compatibility_algorithm.md` — pair and group scoring logic optimized for 2–5 Pokémon
- `04_ui_ux_requirements.md` — core UI states, warnings, labels, and behavior
- `05_implementation_tasks.md` — step-by-step engineering checklist
- `06_codex_prompt.md` — copy-paste prompt for Codex
- `07_types_and_examples.ts` — starter TypeScript interfaces and example records

## Important note about favorites

The app should not only store a Pokémon's favorite **categories**. It should also store a canonical mapping from each favorite category to the concrete **items** that belong to that category.

That means the data model needs both:

1. `pokemon.favorites: FavoriteCategoryId[]`
2. `favoriteCategories[]` where each category includes an `items[]` list

This enables the app to:
- show what items satisfy a Pokémon's favorites
- compute shared favorite categories across groups
- later recommend item lists for a saved roommate group
- later surface a "minimum shared setup" recommendation

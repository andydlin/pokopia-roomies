# Information Architecture

## Top-level navigation
Use a simplified top-level nav:
- Home Builder
- Saved Homes
- Pokédex

## Home Builder
This is the primary product surface.

It includes:
- persistent current home
- Pokémon browse
- Items browse
- Habitats browse
- contextual suggestions
- easy jump points between current home and compatible browsing

## Saved Homes
Dedicated management surface for:
- open
- duplicate
- delete
- rename later if convenient

Also accessible from the builder header/drawer.

## Pokédex
A browse-first experience with 3 sections:
- Pokémon
- Items
- Habitats

Pokédex is for free browsing and reference.
It should reuse as much browser UI as possible, but it does not depend on a current Home.

## Builder browse principle
Within Home Builder, browsers are context-aware.

Examples:
- If the user has selected Pokémon and switches to Items, items should be ranked/grouped by overlapping favorite categories.
- If the user has selected items and switches to Pokémon, Pokémon should be ranked/grouped by how well they match those items.
- If the user opens the full home view, they should be able to jump directly to compatible items, Pokémon, or habitats.

## Important IA principle
Do not make “compatible items” or “matching Pokémon” separate standalone tools.
These should be contextual views of the same shared browser surfaces.

# Codex Prompt — Build the Pokopia Advanced Pokémon Explorer

Build a polished web app called **Pokopia Advanced Pokémon Explorer**.

Use the files in this zip as the source of truth.

## Goal
Create a fast, clean, searchable explorer for Pokémon in Pokémon Pokopia that is more useful than a static database page. The app should help players browse Pokémon by favorites, ideal habitat, specialty, and related item categories, with powerful filtering and sorting.

## Product priorities
1. Make browsing much faster than clicking around a static wiki.
2. Help players discover patterns across Pokémon.
3. Make the UI feel polished, modern, and game-adjacent.
4. Keep the data model flexible so future features like compatibility scoring and saved groups can be added later.

## Build requirements
- Use **Next.js + TypeScript + Tailwind**.
- Create a responsive UI that works well on desktop first, mobile second.
- Use local mock JSON data first.
- Organize code cleanly so the dataset can later be swapped with a real source.
- Add reusable types, helpers, and filtering utilities.
- Include a clean card/grid explorer view.
- Include a detail drawer, sheet, or modal for each Pokémon.
- Include filter controls for favorites, ideal habitat, specialty, and text search.
- Include sort controls.
- Include multi-select filters.
- Include empty states, reset filters, and count of results.
- Include URL-state persistence for filters if reasonable.
- Keep the design tasteful and readable.

## Core screens
### 1. Main Explorer page
Must include:
- page title
- short helper text
- search bar
- filter panel
- active filter chips
- sorting dropdown
- results count
- responsive Pokémon grid

### 2. Pokémon detail view
Must include:
- name
- Pokédex number
- ideal habitat
- specialties
- favorites
- favorite item categories
- optional notes field
- “related Pokémon” section based on shared favorites or same habitat

## Explorer behavior
### Search
Search across:
- name
- number
- habitat
- specialty
- favorites
- tags

### Filters
Support:
- favorites (multi-select)
- ideal habitat (multi-select)
- specialty (multi-select)
- optional evolution family filter if the data exists

### Sorting
Support:
- Pokédex number ascending
- name A–Z
- name Z–A
- number of specialties descending
- number of favorites descending
- compatibility potential (heuristic)

## Compatibility potential heuristic
This is not full roommate scoring yet. Just estimate broad flexibility using a simple formula:
- + points for more favorites
- + points for more specialties
- + points if habitat appears commonly among many Pokémon
- + points if favorite categories overlap with many other Pokémon in dataset

Use this only as a discoverability sort metric.

## UI design direction
- clean and modern
- slightly cozy / game companion feel
- avoid over-design
- use subtle borders, rounded cards, soft shadows
- strong information hierarchy
- filters should feel easy, not overwhelming

## Code quality
- strongly typed data layer
- isolated filter logic
- reusable UI components
- comments only where useful
- no unnecessary complexity

## Deliverables
Generate:
- app scaffold
- sample dataset
- main explorer page
- reusable filter components
- Pokémon card component
- Pokémon detail component
- utilities for filtering and sorting
- README with setup instructions

If a real dataset is incomplete, still build the full app using sample records from the provided schema.

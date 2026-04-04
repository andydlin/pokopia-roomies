# Master Build Prompt for Codex

Build a production-ready web app called **Pokopia Lab** for planning and optimizing Pokémon Pokopia housing setups.

## Core product goal
Turn static Pokopia data into interactive planning tools that help players:
- decide which Pokémon fit well together
- find the best items for a group
- reverse-search by item, category, habitat, or specialty
- save and compare teams without manual cross-referencing

This app is **not** a generic wiki clone. Raw facts already exist on sites like Serebii. This product should focus on:
- decision support
- explainable scoring
- fast filtering and exploration
- planning workflows

---

## Tech stack
Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- local JSON seed data for MVP
- localStorage for saved teams

No auth required for MVP.
No backend required for MVP.
Architecture must be clean enough to support a future DB or Supabase migration.

---

## MVP Features

### 1) Item Optimizer
User selects 1–5 Pokémon.

Return:
- favorite categories shared by all selected Pokémon
- favorite categories shared by some selected Pokémon
- recommended item categories
- recommended concrete items if item mapping exists
- coverage counts like `matches 3/4 selected Pokémon`
- optional tie-breakers based on craftability or source availability

The ranking logic must be reusable and separate from UI.

---

### 2) Reverse Lookup
Allow users to start from constraints instead of starting from Pokémon.

Entry points:
- favorite category
- item
- habitat trait
- specialty

Users should be able to combine filters:
- category + habitat
- item + specialty
- habitat + specialty
- etc.

Return:
- matching Pokémon
- explanation for why each matched
- quick tags
- links to the Pokémon detail / compatibility page

---

### 3) Compatibility Explorer
User selects one Pokémon and sees:
- best teammate candidates
- compatibility score for each candidate
- explanation breakdown:
  - shared favorites
  - habitat alignment
  - habitat conflicts
  - specialty note
- ability to add candidate into a draft team

Scoring must be transparent. Do not show unexplained “magic numbers.”

---

### 4) Saved Teams + Compare
Users can create and save custom teams of 2–5 Pokémon.

Each saved team should show:
- team name
- members
- compatibility score
- shared favorites
- habitat conflicts
- recommended item categories
- recommended concrete items if available

Comparison view should show two saved teams side-by-side:
- total score
- overlap summary
- conflict summary
- recommended items
- inferred style:
  - more flexible
  - more specialized
  - more item-efficient

Persist teams in localStorage for MVP.

---

## Information architecture / routes
Create these routes:

- `/` → home dashboard
- `/items` → Item Optimizer
- `/lookup` → Reverse Lookup
- `/pokemon/[slug]` → Pokémon detail + Compatibility Explorer
- `/teams` → saved teams list
- `/teams/[id]` → saved team detail
- `/compare` → compare two saved teams
- `/dex` → searchable smart dex view (recommended if time permits)

---

## UX requirements
- searchable Pokémon combobox
- tag/chip UI for favorites, habitats, specialty
- explanatory cards for scores and recommendations
- instructional empty states
- desktop-first but responsive
- avoid clutter
- avoid giant data tables unless comparison truly benefits from a table
- let users understand *why* results appeared

---

## Data model requirements
Use normalized TypeScript models for:
- Pokémon
- favorite categories
- items
- habitat traits
- specialties
- locations
- saved teams

Important:
- favorites must work at category level
- item recommendations must work at item level
- habitat traits should support conflicts like:
  - bright vs dark
  - humid vs dry
  - warm vs cool
  - quiet vs lively (future-friendly)
- specialties should be modeled cleanly even if they are mostly display/filter metadata for MVP

---

## Scoring requirements
Implement a centralized compatibility scoring engine.

Principles:
1. Shared favorite category overlap = strongest positive factor
2. Compatible habitat traits = positive
3. Habitat conflicts = negative
4. Specialty can be neutral or a light modifier
5. Scale cleanly from team size 2 to 5
6. Return explanation breakdown, not just a score

Preferred structure:
- pairwise scoring between Pokémon
- team-level aggregation
- no double counting
- easy-to-tune weight constants

---

## Output / deliverables
Generate:
1. runnable Next.js app
2. clean folder structure
3. strongly typed models
4. reusable utility functions
5. sample normalized JSON dataset
6. localStorage team persistence
7. concise README
8. comments only where they help

---

## Suggested build order
1. Types + sample data
2. Core selectors + scoring utilities
3. Item Optimizer
4. Reverse Lookup
5. Pokémon detail + Compatibility Explorer
6. Saved Teams
7. Compare view
8. Smart Dex if time remains
9. Polish UI

---

## Code quality rules
- no monolithic files
- strong TypeScript types
- domain logic separated from presentation
- utility functions pure where possible
- components small and reusable
- meaningful naming
- no placeholder TODOs unless clearly labeled
- app should run without requiring external APIs

---

## Stretch goals
If time permits, add:
- “best teammates” section on smart dex cards
- “most flexible Pokémon” ranking
- “best item coverage” ranking
- import pipeline stub for future source-data transformations

# Pokopia Lab – Product + Technical Spec

## 1. Product summary
Pokopia Lab is an interactive planning toolkit for Pokémon Pokopia. It sits on top of static game data and helps players make faster, better decisions when building housing setups.

The core value is not “look up facts.” The core value is:
- cross-reference data instantly
- score compatibility
- recommend items for a team
- save and compare builds

## 2. User problems
Players are likely dealing with:
- too much manual cross-referencing of favorites and habitats
- difficulty seeing which items benefit the most Pokémon
- uncertainty about who makes good teammates
- no easy way to preserve and compare planned teams
- fragmented browsing between Pokémon pages, item pages, and habitat notes

## 3. Primary user jobs to be done
### A. “Help me pick the best items for these Pokémon.”
Solved by Item Optimizer.

### B. “Show me all Pokémon that match a specific condition.”
Solved by Reverse Lookup.

### C. “I like this Pokémon. Who should I pair it with?”
Solved by Compatibility Explorer.

### D. “I want to save and compare multiple ideas.”
Solved by Saved Teams + Compare.

## 4. Functional requirements

### 4.1 Item Optimizer
Input:
- 1–5 selected Pokémon

Output:
- shared favorite categories
- partial overlap categories
- item recommendations ranked by coverage
- optional craftability / source badges
- explanation text

### 4.2 Reverse Lookup
Filter dimensions:
- favorite category
- item
- habitat trait
- specialty

Output:
- matching Pokémon
- explanation badges
- links to detail pages

### 4.3 Compatibility Explorer
Input:
- one selected Pokémon

Output:
- ranked compatible Pokémon
- score + explanation
- favorite overlap summary
- habitat alignment summary
- conflict warnings
- add-to-team affordance

### 4.4 Saved Teams + Compare
Input:
- team name
- 2–5 Pokémon

Output:
- saved team cards
- detail view
- compare view between two teams
- local persistence

## 5. Information architecture
- Home
- Item Optimizer
- Reverse Lookup
- Pokémon detail / Compatibility
- Teams
- Compare
- Smart Dex

## 6. MVP scope
In:
- local data
- local team saving
- 4 core features
- simple smart dex

Out:
- auth
- database
- live scraping
- multiplayer sharing
- public profiles

## 7. Future scope
- account sync
- cloud saves
- collaborative / public team links
- recommendation engine
- advanced weighted preferences
- progression-based “what to build next”

## 8. Technical constraints
- App Router
- TypeScript
- Tailwind
- JSON data in repo
- reusable domain utilities
- easy future migration to backend

## 9. Non-functional requirements
- fast search and filtering
- mobile-friendly
- explainable results
- maintainable code
- strongly typed domain layer

## 10. Acceptance criteria
A user should be able to:
- pick a group and see best item categories + items
- reverse-filter Pokémon by favorites / item / habitat / specialty
- open a Pokémon and understand top teammate candidates
- save at least two teams and compare them

Read everything in ./chatgpt/pokopia_home_builder_revamp_pack_v1 and revamp the current website into a unified Pokopia Home Builder product.

Context:
- The pack has already been unzipped into the repo at ./chatgpt/pokopia_home_builder_revamp_pack_v1.
- Treat all files in that folder as the source of truth for product direction, IA, builder behavior, suggestion logic, item ranking, saved homes, cross-device restore, and implementation architecture.
- The current repo already has a useful base. Refactor and migrate rather than throwing away working code unless a clean replacement is clearly better.

Primary product change:
- The product is no longer a set of separate tools.
- The product is now centered around one persistent Home Builder.
- A Home consists of Pokémon, Items, and a Habitat.
- Users can start from any angle: Pokémon-first, item/theme-first, habitat-first, or a partial home.
- The system should guide users with contextual ranking and suggestions, but never block open-ended building.

Critical requirements:
1. Keep all browsing open. Users must always be able to add any Pokémon, item, or habitat.
2. Do not display numeric compatibility scores anywhere in the UI.
3. Implement a sticky, always-accessible home builder shell on desktop and mobile.
4. Add Saved Homes.
5. Implement backend-backed restore code support now so users can continue on another device without creating an account.
6. Preserve easy back-and-forth navigation between builder, browsing, details, suggestions, and saved homes.
7. Keep the app responsive for desktop and mobile.
8. Build clean architecture: data layer, pure logic layer, UI/view-model layer.

Implementation phases inside this revamp:
- Phase A: introduce normalized Home state, Saved Homes, browse state, and storage adapters.
- Phase B: build the new Home Builder shell and route structure.
- Phase C: implement contextual item browsing and suggestion logic.
- Phase D: extend the same pattern to Pokémon and Habitats.
- Phase E: implement restore code backend integration and UI.
- Phase F: remove or deprecate legacy tool-first surfaces and dead code.

Deliverables expected:
- Updated routes and IA
- New Home Builder experience
- Saved Homes management
- Contextual browser views for Pokémon, Items, Habitats
- Suggestion engine
- Restore code flow (export/import session)
- Tests for pure logic and storage/session behavior

Read every file in this folder first, then inspect the existing repo structure, then implement the revamp into the current codebase.

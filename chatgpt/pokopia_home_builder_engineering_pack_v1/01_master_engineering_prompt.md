# Master Engineering Prompt

Read everything in this folder and implement the specified architecture into the current codebase.

Requirements:
1. Refactor the app into a Home-centered architecture.
2. Preserve existing data assets wherever possible.
3. Keep the app functional during migration.
4. Use pure functions/selectors for domain logic.
5. Use local-first persistence plus restore-code support with backend-ready adapters.
6. Preserve URL-backed browse state and easy back-and-forth navigation.
7. Do not show user-facing numeric compatibility scores.
8. Do not block any add action for Pokémon, items, or habitats.
9. Maintain responsive desktop + mobile behavior.

Implementation strategy:
- Phase A: introduce new domain/state architecture behind existing UI.
- Phase B: replace builder shell and route structure.
- Phase C: implement contextual browsers.
- Phase D: wire restore-code backend flow.
- Phase E: delete legacy dead paths/components.

Deliverables:
- working app
- tests passing
- summary of architectural decisions and any deviations

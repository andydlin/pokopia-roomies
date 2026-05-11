# Codex Working Rules (Project-Specific)

## Shared-First UI Changes

When a user asks for a UI style/behavior change:

1. Check for an existing shared component, token, or global style first.
2. Prefer updating shared primitives over one-off inline classes.
3. If a one-off change is necessary, explain why and ask for confirmation when tradeoffs are non-obvious.
4. Keep new patterns reusable (variant classes/components) so future updates are centralized.

## Confirmation Preference

Before making broad UI refactors, propose:
- `shared update` (recommended), or
- `local patch` (faster, less reusable)

Then proceed with the chosen path.

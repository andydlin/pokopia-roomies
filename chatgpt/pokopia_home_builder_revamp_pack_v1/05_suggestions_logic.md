# Suggestions Logic

## Purpose
Suggestions help users improve a Home without forcing behavior.
They are separate from manual build controls.

## Suggestion principles
- optional
- actionable
- human-readable
- explainable
- no numeric scores shown

## Category derivation
From selected Pokémon, derive favorite-category strength.

Suggested thresholds:
- all: count === totalPokemon
- most: count >= ceil(totalPokemon * 0.6) and < totalPokemon
- some: count >= 2 and < ceil(totalPokemon * 0.6)
- single: count === 1

Single should rarely drive top recommendations.

## Coverage states
Based on selected items that are comfort-relevant:
- missing: supplyCount === 0
- partial: supplyCount > 0 && supplyCount < demandCount
- covered: supplyCount >= demandCount && supplyCount <= demandCount * 1.5
- overcovered: supplyCount > demandCount * 1.5

## Suggestion priorities
1. Resolve conflicts
2. Fill missing categories
3. Improve partial coverage
4. Reinforce strong directions
5. Expand with matching Pokémon/habitat/items

## Suggestion kinds
- habitat_conflict
- missing_category
- partial_category
- reinforce_theme
- suggest_pokemon
- suggest_habitat
- theme_direction

## Example suggestion structure
```ts
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

export type SuggestionCardModel = {
  id: string;
  kind: string;
  priority: SuggestionPriority;
  label: string;
  headline: string;
  body: string;
  action?: {
    label: string;
    payload: unknown;
  };
  previewChips?: Array<{
    type: 'pokemon' | 'item' | 'category' | 'habitat';
    id: string;
    label: string;
  }>;
};
```

## UX rule
Suggestions must not:
- block choices
- silently override choices
- remove access to non-suggested content

They should usually:
- filter a browser
- open a contextual browse view
- prefill a tab/mode
- perform simple reversible actions when appropriate

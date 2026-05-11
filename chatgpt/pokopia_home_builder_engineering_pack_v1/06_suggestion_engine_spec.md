# Suggestion Engine Spec

## Goals
Generate human-friendly, optional suggestions without exposing numeric scores.

## Input signals
- pokemon favorite category overlap
- current item comfort coverage
- current habitat fit
- missing comfort categories
- strong existing themes

## Priority ordering
1. conflicts
2. missing essentials
3. partial coverage
4. reinforcement
5. expansion

## Types

```ts
export type SuggestionPriority = "critical" | "high" | "medium" | "low";

export type SuggestionKind =
  | "habitat_conflict"
  | "missing_category"
  | "partial_category"
  | "reinforce_theme"
  | "suggest_pokemon"
  | "suggest_habitat"
  | "theme_direction";

export type SuggestionAction =
  | { type: "open_items"; categoryId: string }
  | { type: "open_pokemon"; filters: { categoryIds?: string[]; habitatId?: string } }
  | { type: "set_habitat"; habitatId: string }
  | { type: "add_item"; itemId: string }
  | { type: "dismiss" };

export type SuggestionCardModel = {
  id: string;
  kind: SuggestionKind;
  priority: SuggestionPriority;
  label: string;
  headline: string;
  body: string;
  action?: { label: string; payload: SuggestionAction };
  previewChips?: Array<{ type: "pokemon" | "item" | "category" | "habitat"; id: string; label: string }>;
};
```

## Thresholds
- `all`: category count equals total selected pokemon
- `most`: category count >= ceil(totalPokemon * 0.6) and < totalPokemon
- `some`: count >= 2 and < ceil(totalPokemon * 0.6)
- `single`: count === 1

## Coverage states
- `missing`: supplyCount === 0
- `partial`: supplyCount > 0 && supplyCount < demandCount
- `covered`: supplyCount >= demandCount && supplyCount <= demandCount * 1.5
- `overcovered`: supplyCount > demandCount * 1.5

## Rule summaries
- habitat mismatch produces conflict suggestion
- missing all/most categories produce high-priority suggestions
- partial categories produce medium suggestions
- strong all/most covered categories can produce reinforcement suggestions
- dominant item/theme/habitat signals can suggest pokemon or habitats

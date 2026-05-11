# Domain Models and Selectors

## Domain models

```ts
export type FavoriteCategoryId = string;

export type Pokemon = {
  id: string;
  slug: string;
  name: string;
  favoriteCategoryIds: FavoriteCategoryId[];
  idealHabitatId: string | null;
  specialtyIds?: string[];
};

export type Item = {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  generalCategoryId: string;
  generalCategoryLabel: string;
  comfortCategoryIds: FavoriteCategoryId[];
  comfortCategoryLabels: string[];
  isComfortRelevant: boolean;
};

export type Habitat = {
  id: string;
  slug: string;
  name: string;
  relatedComfortCategoryIds?: FavoriteCategoryId[];
};
```

## Required selectors
- `selectCurrentHome`
- `selectSavedHomes`
- `selectResolvedHomeEntities`
- `selectHomeCategoryStrengths`
- `selectHomeCategoryCoverage`
- `selectHomeSummary`
- `selectSuggestionsForCurrentHome`
- `selectRankedItemsForCurrentHome`
- `selectItemBrowserSections`
- `selectRankedPokemonForCurrentHome`
- `selectPokemonBrowserSections`
- `selectRankedHabitatsForCurrentHome`
- `selectHabitatBrowserSections`

## Selector rules
- selectors must be pure
- expensive selectors should be memoized
- selectors should consume normalized entity maps, not raw arrays when possible

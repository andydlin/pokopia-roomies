# State Architecture

## Canonical entities

```ts
export type EntityStore = {
  pokemonById: Record<string, Pokemon>;
  itemsById: Record<string, Item>;
  habitatsById: Record<string, Habitat>;
  allPokemonIds: string[];
  allItemIds: string[];
  allHabitatIds: string[];
};
```

## Current home state

```ts
export type CurrentHomeState = {
  id: string | null;
  name: string;
  pokemonIds: string[];
  itemIds: string[];
  habitatId: string | null;
  isDirty: boolean;
  lastSavedAt: number | null;
};
```

## Saved homes

```ts
export type SavedHome = {
  id: string;
  name: string;
  pokemonIds: string[];
  itemIds: string[];
  habitatId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SavedHomesState = {
  byId: Record<string, SavedHome>;
  allIds: string[];
};
```

## Browse state

```ts
export type BrowseTab = "pokemon" | "items" | "habitats";
export type ItemBrowseMode = "contextual" | "all";
export type ItemBrowseIntent = "best_fit" | "missing_categories" | "all_items" | null;

export type BuilderBrowseState = {
  activeTab: BrowseTab;
  items: {
    browseMode: ItemBrowseMode;
    intent: ItemBrowseIntent;
    searchQuery: string;
    generalCategoryId: string | null;
    comfortCategoryId: string | null;
  };
  pokemon: {
    browseMode: "contextual" | "all";
    searchQuery: string;
    favoriteCategoryId: string | null;
    habitatId: string | null;
  };
  habitats: {
    browseMode: "contextual" | "all";
    searchQuery: string;
  };
};
```

## UI state

```ts
export type BuilderUiState = {
  isExpandedHomeOpen: boolean;
  isSavedHomesOpen: boolean;
  isMobileBuilderSheetOpen: boolean;
  recentlyAddedPokemonId: string | null;
  recentlyAddedItemId: string | null;
  toast: { message: string; undoActionId?: string } | null;
};
```

## Root feature state

```ts
export type HomeBuilderFeatureState = {
  currentHome: CurrentHomeState;
  savedHomes: SavedHomesState;
  browse: BuilderBrowseState;
  ui: BuilderUiState;
};
```

# React Components and State Architecture

## Route direction
Use a route structure equivalent to:

```tsx
/                    -> redirect to /builder or lightweight landing
/builder             -> HomeBuilderPage
/builder/pokemon     -> HomeBuilderPage with pokemon tab
/builder/items       -> HomeBuilderPage with items tab
/builder/habitats    -> HomeBuilderPage with habitats tab
/homes               -> SavedHomesPage
/pokedex             -> PokedexLayout
/pokedex/pokemon     -> PokedexPokemonPage
/pokedex/items       -> PokedexItemsPage
/pokedex/habitats    -> PokedexHabitatsPage
```

## Builder shell composition
```tsx
<HomeBuilderProvider>
  <HomeBuilderPage>
    <BuilderLayout>
      <StickyHomePanel />
      <BrowserPanel>
        <BrowseModeTabs />
        <ContextSummaryBar />
        <SuggestionRail />
        <BrowserContent />
      </BrowserPanel>
      <ExpandedHomeDrawer />
    </BuilderLayout>
  </HomeBuilderPage>
</HomeBuilderProvider>
```

## Key components
- HomeBuilderPage
- StickyHomePanel
- ExpandedHomeDrawer
- BrowserPanel
- BrowseModeTabs
- ContextSummaryBar
- SuggestionRail
- ItemsBrowserView
- PokemonBrowserView
- HabitatsBrowserView
- SavedHomesPage
- SavedHomesPopover or Drawer

## Example builder-side props
```ts
export type StickyHomePanelProps = {
  home: CurrentHomeState;
  summary: HomeSummaryViewModel;
  onRename: (name: string) => void;
  onOpenExpanded: () => void;
  onOpenSavedHomes: () => void;
  onOpenTransfer: () => void;
};
```

## State domains
Split into:
1. Canonical entities
2. Current builder state
3. Saved homes state
4. Browse state
5. UI state
6. Session portability state

### Canonical entities
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

### Current builder state
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

### Saved homes state
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

### Browse state
```ts
export type BuilderBrowseState = {
  activeTab: 'pokemon' | 'items' | 'habitats';
  items: {
    browseMode: 'contextual' | 'all';
    intent: 'best_fit' | 'missing_categories' | 'all_items' | null;
    searchQuery: string;
    generalCategoryId: string | null;
    comfortCategoryId: string | null;
  };
  pokemon: {
    browseMode: 'contextual' | 'all';
    searchQuery: string;
    favoriteCategoryId: string | null;
    habitatId: string | null;
  };
  habitats: {
    browseMode: 'contextual' | 'all';
    searchQuery: string;
  };
};
```

### UI state
```ts
export type BuilderUiState = {
  isExpandedHomeOpen: boolean;
  isSavedHomesOpen: boolean;
  isTransferModalOpen: boolean;
  isRestoreModalOpen: boolean;
  isMobileBuilderSheetOpen: boolean;
  pendingToast: ToastMessage | null;
};
```

## State ownership
Use a dedicated builder provider/store.
Keep logic out of leaf components.

Preferred architecture:
- React context + reducer or lightweight store
- pure selectors for derived state
- storage/session adapters isolated from component code

## Example reducer actions
```ts
export type HomeBuilderAction =
  | { type: 'home/set-name'; name: string }
  | { type: 'home/add-pokemon'; pokemonId: string }
  | { type: 'home/remove-pokemon'; pokemonId: string }
  | { type: 'home/add-item'; itemId: string }
  | { type: 'home/remove-item'; itemId: string }
  | { type: 'home/set-habitat'; habitatId: string | null }
  | { type: 'saved/save-current' }
  | { type: 'saved/load'; homeId: string }
  | { type: 'saved/delete'; homeId: string }
  | { type: 'saved/duplicate'; homeId: string }
  | { type: 'browse/set-tab'; tab: 'pokemon' | 'items' | 'habitats' }
  | { type: 'browse/items/set-mode'; mode: 'contextual' | 'all' }
  | { type: 'browse/items/set-intent'; intent: 'best_fit' | 'missing_categories' | 'all_items' | null }
  | { type: 'browse/items/set-search'; query: string }
  | { type: 'browse/items/set-general-category'; categoryId: string | null }
  | { type: 'browse/items/set-comfort-category'; categoryId: string | null }
  | { type: 'ui/open-expanded-home' }
  | { type: 'ui/close-expanded-home' }
  | { type: 'ui/open-transfer' }
  | { type: 'ui/close-transfer' }
  | { type: 'ui/open-restore' }
  | { type: 'ui/close-restore' };
```

## Selector direction
Create pure selectors like:
- selectCurrentHome
- selectResolvedCurrentHome
- selectHomeCategoryStrengths
- selectHomeCategoryCoverage
- selectItemBrowserSummary
- selectRankedItemsForCurrentHome
- selectItemBrowserSections
- selectSuggestionsForCurrentHome

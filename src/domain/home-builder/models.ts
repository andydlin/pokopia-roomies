export type BrowseTab = "pokemon" | "items" | "favorites" | "habitats";

export type ItemBrowseMode = "contextual" | "all";
export type ItemBrowseIntent = "best_fit" | "missing_categories" | "all_items" | null;
export type GenericBrowseMode = "contextual" | "all";

export type FavoriteCategoryId = string;

export type HomeCategoryShareType = "all" | "most" | "some" | "single";

export type HomeCategoryStrength = {
  categoryId: string;
  count: number;
  totalPokemon: number;
  shareType: HomeCategoryShareType;
};

export type CategoryCoverageState = {
  categoryId: string;
  demandCount: number;
  supplyCount: number;
  state: "missing" | "partial" | "covered" | "overcovered";
};

export type HomeBuilderPokemon = {
  id: string;
  slug: string;
  name: string;
  typeIds: string[];
  favoriteCategoryIds: FavoriteCategoryId[];
  idealHabitatId: string | null;
  habitatIds: string[];
  specialtyIds: string[];
  imageUrl?: string | null;
};

export type HomeBuilderItem = {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  generalCategoryId: string;
  generalCategoryLabel: string;
  comfortCategoryIds: FavoriteCategoryId[];
  comfortCategoryLabels: string[];
  favoriteCategoryIds: FavoriteCategoryId[];
  isComfortRelevant: boolean;
  craftable: boolean;
  materials: Array<{
    itemName: string;
    quantity: number;
  }>;
  obtainabilityDetails: string[];
  sources: Array<{
    type: "craft" | "shop" | "field" | "event" | "unknown";
    label: string;
  }>;
};

export type HomeBuilderHabitat = {
  id: string;
  slug: string;
  name: string;
  relatedComfortCategoryIds: FavoriteCategoryId[];
  image?: string | null;
  requiredItems: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
  }>;
};

export type EntityStore = {
  pokemonById: Record<string, HomeBuilderPokemon>;
  itemsById: Record<string, HomeBuilderItem>;
  habitatsById: Record<string, HomeBuilderHabitat>;
  allPokemonIds: string[];
  allItemIds: string[];
  allHabitatIds: string[];
};

export type CurrentHomeState = {
  id: string | null;
  name: string;
  pokemonIds: string[];
  itemIds: string[];
  itemQuantities: Record<string, number>;
  materialProgress: Record<string, { ownedQuantity: number }>;
  habitatId: string | null;
  isDirty: boolean;
  lastSavedAt: number | null;
};

export type SavedHome = {
  id: string;
  name: string;
  pokemonIds: string[];
  itemIds: string[];
  itemQuantities: Record<string, number>;
  materialProgress: Record<string, { ownedQuantity: number }>;
  habitatId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SavedHomesState = {
  byId: Record<string, SavedHome>;
  allIds: string[];
};

export type BuilderBrowseState = {
  activeTab: BrowseTab;
  items: {
    browseMode: ItemBrowseMode;
    intent: ItemBrowseIntent;
    searchQuery: string;
    generalCategoryId: string | null;
    comfortCategoryId: string | null;
    favoriteCategoryId: string | null;
    detailItemId: string | null;
  };
  pokemon: {
    browseMode: GenericBrowseMode;
    searchQuery: string;
    typeId: string | null;
    favoriteCategoryId: string | null;
    habitatId: string | null;
    detailPokemonId: string | null;
  };
  favorites: {
    browseMode: GenericBrowseMode;
    searchQuery: string;
    favoriteCategoryId: string | null;
  };
  habitats: {
    browseMode: GenericBrowseMode;
    searchQuery: string;
    detailHabitatId: string | null;
  };
};

export type BuilderUiState = {
  isExpandedHomeOpen: boolean;
  isSavedHomesOpen: boolean;
  isTransferModalOpen: boolean;
  isRestoreModalOpen: boolean;
  isMobileBuilderSheetOpen: boolean;
  recentlyAddedPokemonId: string | null;
  recentlyAddedItemId: string | null;
  activeMaterialHighlightId: string | null;
  hoveredBuildItemId: string | null;
  toast: { message: string; undoActionId?: string } | null;
};

export type SessionPortabilityState = {
  exportStatus: "idle" | "loading" | "success" | "error";
  importStatus: "idle" | "loading" | "success" | "error";
  lastGeneratedCode: string | null;
  lastCodeExpiry: number | null;
  lastError: string | null;
  cloudSyncError: string | null;
};

export type HomeBuilderFeatureState = {
  currentHome: CurrentHomeState;
  savedHomes: SavedHomesState;
  browse: BuilderBrowseState;
  ui: BuilderUiState;
  session: SessionPortabilityState;
};

export type PersistedSessionPayload = {
  version: 1;
  currentHome: CurrentHomeState | null;
  savedHomes: SavedHome[];
  exportedAt: number;
};

export interface LocalSessionAdapter {
  load(): PersistedSessionPayload | null;
  save(payload: PersistedSessionPayload): void;
  clear(): void;
}

export interface SessionTransportAdapter {
  exportSession(payload: PersistedSessionPayload): Promise<{ code: string; expiresAt?: number | null }>;
  importSession(code: string): Promise<PersistedSessionPayload>;
}

export type RankedItemBucket = "best_match" | "supporting_match" | "neutral";

export type RankedItem = {
  item: HomeBuilderItem;
  score: number;
  bucket: RankedItemBucket;
  matchedCategoryIds: string[];
  matchedShareTypes: HomeCategoryShareType[];
  fillsMissingCategoryIds: string[];
  fillsPartialCategoryIds: string[];
};

export type RankedPokemon = {
  pokemon: HomeBuilderPokemon;
  score: number;
  section: "strong" | "good" | "some" | "none";
  bucket: "best_match" | "supporting_match" | "neutral";
  matchedCategoryIds: string[];
  sharedFavorites: string[];
  coreMatches: string[];
  multiMatches: string[];
  habitatMatches: string[];
  preferredHabitatMatchId: string | null;
  preferredHabitatMatchCount: number;
};

export type RankedHabitat = {
  habitat: HomeBuilderHabitat;
  score: number;
  bucket: "best_match" | "supporting_match" | "neutral";
  matchedPokemonCount: number;
  matchedCategoryIds: string[];
};

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

export type BuildItemEntry = {
  buildItemInstanceId: string;
  itemId: string;
  itemName: string;
  quantityInBuild: number;
  item: HomeBuilderItem;
};

export type MaterialContributor = {
  buildItemInstanceId: string;
  itemId: string;
  itemName: string;
  quantityOfItemInBuild: number;
  quantityPerItemRecipe: number;
  totalContribution: number;
};

export type MaterialAggregate = {
  materialId: string;
  materialName: string;
  materialItemId: string | null;
  totalNeeded: number;
  usedByCount: number;
  contributors: MaterialContributor[];
};

export type RecipeStatusBreakdown = {
  craftableWithRecipe: number;
  nonCraftable: number;
  unknownRecipe: number;
};

export type MaterialProgressEntry = {
  materialId: string;
  materialName: string;
  ownedQuantity: number;
  totalNeeded: number;
  remainingQuantity: number;
  isComplete: boolean;
  usedByCount: number;
  contributors: MaterialContributor[];
};

export type BuildProgressSummary = {
  completedMaterials: number;
  incompleteMaterials: number;
  totalMaterials: number;
  totalMaterialPiecesNeeded: number;
  totalMaterialPiecesOwned: number;
  totalMaterialPiecesOwnedEffective: number;
  completionPercentage: number;
};

export type BuildComparisonStats = {
  buildId: string;
  buildName: string;
  itemCount: number;
  itemQuantityTotal: number;
  uniqueMaterialsCount: number;
  totalMaterialPieces: number;
  craftableItemsCount: number;
  nonCraftableItemsCount: number;
  unknownRecipeItemsCount: number;
  completionPercentage: number;
};

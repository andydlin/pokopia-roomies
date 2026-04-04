export type ID = string;

export type HabitatAxis = "light" | "moisture" | "temperature" | "activity";

export type HabitatTraitValue =
  | "bright"
  | "dark"
  | "humid"
  | "dry"
  | "warm"
  | "cool"
  | "lively"
  | "quiet";

export interface HabitatTrait {
  id: ID;
  axis: HabitatAxis;
  value: HabitatTraitValue;
  label: string;
  oppositeTraitId?: ID;
}

export interface FavoriteCategory {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  itemIds: ID[];
}

export interface ItemSource {
  type: "craft" | "shop" | "field" | "event" | "unknown";
  label: string;
}

export interface CraftMaterial {
  itemName: string;
  quantity: number;
}

export interface Item {
  id: ID;
  name: string;
  slug: string;
  favoriteCategoryIds: ID[];
  habitatTraitIds?: ID[];
  craftable: boolean;
  materials?: CraftMaterial[];
  sources?: ItemSource[];
}

export interface Specialty {
  id: ID;
  name: string;
  slug: string;
  description?: string;
}

export interface Location {
  id: ID;
  name: string;
  slug: string;
  notes?: string;
}

export interface Habitat {
  id: ID;
  number: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sourceUrl?: string;
}

export interface Pokemon {
  id: ID;
  dexNumber?: number;
  name: string;
  slug: string;
  specialtyId: ID;
  favoriteCategoryIds: ID[];
  idealHabitatTraitIds: ID[];
  locationIds: ID[];
  imageUrl?: string;
}

export interface SavedTeam {
  id: ID;
  name: string;
  pokemonIds: ID[];
  createdAt: string;
  updatedAt: string;
}

export interface PairHabitatConflict {
  traitAId: ID;
  traitBId: ID;
}

export interface PairScoreBreakdown {
  pokemonAId: ID;
  pokemonBId: ID;
  sharedFavoriteCategoryIds: ID[];
  matchingHabitatTraitIds: ID[];
  conflictingHabitatPairs: PairHabitatConflict[];
  specialtyModifier: number;
  score: number;
}

export interface TeamConflict {
  pokemonAId: ID;
  pokemonBId: ID;
  traitAId: ID;
  traitBId: ID;
}

export interface RecommendedCategory {
  categoryId: ID;
  matchedPokemonIds: ID[];
  itemCount: number;
  score: number;
  reasons: string[];
}

export interface ItemRecommendation {
  itemId: ID;
  matchedPokemonIds: ID[];
  matchedFavoriteCategoryIds: ID[];
  score: number;
  reasons: string[];
}

export type SummaryLabel = "excellent" | "good" | "mixed" | "poor";

export interface TeamScoreBreakdown {
  teamPokemonIds: ID[];
  pairBreakdowns: PairScoreBreakdown[];
  sharedFavoriteCategoryIdsAll: ID[];
  sharedFavoriteCategoryIdsAny: ID[];
  matchingHabitatTraitIdsAll: ID[];
  conflictingHabitatPairs: TeamConflict[];
  recommendedFavoriteCategoryIds: ID[];
  recommendedItemIds: ID[];
  totalScore: number;
  summaryLabel: SummaryLabel;
  rawPairTotal: number;
  pairCount: number;
  allSharedFavoriteBonus: number;
  allSharedHabitatBonus: number;
  explanation: string[];
}

export interface LookupFilters {
  query: string;
  favoriteCategoryId: ID | "all";
  itemId: ID | "all";
  habitatTraitId: ID | "all";
  specialtyId: ID | "all";
}

export interface LookupMatch {
  pokemonId: ID;
  reasons: string[];
}

export interface TeamStyleSummary {
  label: string;
  description: string;
}

export interface AssetManifestEntry {
  assetId: string;
  filename: string;
  localPath: string;
  sourceUrl: string;
}

export type PokemonExplorerEntry = {
  id: string;
  number: number;
  slug: string;
  name: string;
  image?: string;
  idealHabitat: string;
  specialties: string[];
  favorites: string[];
  favoriteItemCategories: string[];
  tags?: string[];
  evolutionFamily?: string;
  notes?: string;
};

export type ExplorerSortOption =
  | "number-asc"
  | "name-asc"
  | "name-desc"
  | "specialty-count-desc"
  | "favorites-count-desc"
  | "compatibility-potential-desc";

export interface ExplorerFilters {
  query: string;
  favorites: string[];
  idealHabitats: string[];
  specialties: string[];
}

export interface ExplorerFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface ExplorerResult {
  entry: PokemonExplorerEntry;
  compatibilityPotential: number;
}

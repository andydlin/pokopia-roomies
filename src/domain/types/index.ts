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
  description?: string | null;
  itemIds: ID[];
  sourceType?: string | null;
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
  imageUrl?: string | null;
  itemCategory?: string | null;
  itemCategoryLabel?: string | null;
  comfortCategoryIds: ID[];
  comfortCategoryLabels: string[];
  favoriteCategoryIds: ID[];
  benefitingPokemonIds: ID[];
  habitatTraitIds: ID[];
  craftable: boolean;
  materials: CraftMaterial[];
  obtainabilityDetails?: string[];
  sources: ItemSource[];
  availabilityConfidence?: "low" | "medium" | "high";
  sourceLabels?: {
    category?: string | null;
    favoriteCategories?: string[];
  };
}

export interface Specialty {
  id: ID;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Location {
  id: ID;
  name: string;
  slug: string;
  notes?: string | null;
}

export interface Habitat {
  id: ID;
  number: number;
  name: string;
  slug: string;
  traitIds: ID[];
  requiredItems?: Array<{
    itemId: ID;
    itemName: string;
    quantity: number;
  }>;
  description?: string | null;
  imageUrl?: string | null;
  sourceUrl?: string | null;
}

export interface PokemonSourceMetadata {
  sourceSlug: string;
  sourceLabels?: {
    idealHabitat?: string | null;
    favorites?: string[];
    specialties?: string[];
    types?: string[];
    habitats?: string[];
  };
  sourceNotes?: string | null;
  timeOfDay?: string[];
  weather?: string[];
  duplicateDexEntryCount: number;
}

export interface Pokemon {
  id: ID;
  slug: string;
  dexNumber: number | null;
  name: string;
  formName: string | null;
  fullDisplayName: string;
  speciesId: ID;
  formId: ID | null;
  typeIds: ID[];
  specialtyIds: ID[];
  favoriteCategoryIds: ID[];
  idealHabitatTraitIds: ID[];
  habitatIds: ID[];
  locationIds: ID[];
  evolutionFamilyId: ID | null;
  description?: string | null;
  imageUrl?: string | null;
  source: PokemonSourceMetadata;
}

export interface Team {
  id: ID;
  name: string;
  pokemonIds: ID[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamsStorageEnvelope {
  version: 1;
  teams: Team[];
  draftPokemonIds: ID[];
}

export interface TeamStorageIssue {
  code:
    | "invalid_json"
    | "invalid_envelope"
    | "invalid_version"
    | "invalid_team"
    | "invalid_draft"
    | "missing_pokemon";
  message: string;
  teamId?: ID;
  pokemonId?: ID;
}

export interface TeamResolution {
  members: Pokemon[];
  missingPokemonIds: ID[];
}

export interface PairHabitatConflict {
  traitAId: ID;
  traitBId: ID;
}

export interface PairScoreBreakdown {
  pokemonAId: ID;
  pokemonBId: ID;
  sharedFavoriteCategoryIds: ID[];
  sharedHabitatIds: ID[];
  sharedIdealHabitatTraitIds: ID[];
  matchingHabitatTraitIds: ID[];
  sharedSpecialtyIds: ID[];
  conflictingHabitatPairs: PairHabitatConflict[];
  specialtyModifier: number;
  score: number;
  explanation: string[];
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
  habitatId?: ID | null;
  score: number;
  reasons: string[];
}

export interface HabitatCoverageBreakdown {
  habitatId: ID;
  habitatFitItemIds: ID[];
  matchedItemIds: ID[];
  matchedFavoriteCategoryIds: ID[];
  stronglySupportedPokemonIds: ID[];
  weaklySupportedPokemonIds: ID[];
  pokemonCoverage: Array<{
    pokemonId: ID;
    coveredFavoriteCategoryIds: ID[];
    coverageRatio: number;
  }>;
  averagePokemonCoverageRatio: number;
  preferredPokemonIds: ID[];
  supportedPokemonRatio: number;
  categoryCoverageRatio: number;
  efficiencyRatio: number;
  score: number;
  explanation: string[];
}

export type SummaryLabel = "excellent" | "good" | "mixed" | "poor";

export interface TeamScoreBreakdown {
  teamPokemonIds: ID[];
  pairBreakdowns: PairScoreBreakdown[];
  sharedFavoriteCategoryIdsAll: ID[];
  sharedFavoriteCategoryIdsAny: ID[];
  sharedHabitatIdsAll: ID[];
  matchingHabitatTraitIdsAll: ID[];
  conflictingHabitatPairs: TeamConflict[];
  selectedHabitatId: ID | null;
  habitatCoverage: HabitatCoverageBreakdown | null;
  recommendedFavoriteCategoryIds: ID[];
  recommendedItemIds: ID[];
  totalScore: number;
  summaryLabel: SummaryLabel;
  rawPairTotal: number;
  pairCount: number;
  allSharedFavoriteBonus: number;
  allSharedHabitatBonus: number;
  habitatSupportBonus: number;
  explanation: string[];
}

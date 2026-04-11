import type { ID } from "../domain/types";

export interface LookupFilters {
  query: string;
  favoriteCategoryId: ID | "all";
  comfortCategoryId: ID | "all";
  itemId: ID | "all";
  habitatTraitId: ID | "all";
  specialtyId: ID | "all";
}

export interface LookupMatch {
  pokemonId: ID;
  reasons: string[];
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

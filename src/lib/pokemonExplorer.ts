import { pokemonExplorerEntries } from "../data/pokemonExplorer";
import type {
  ExplorerFilterOption,
  ExplorerFilters,
  ExplorerResult,
  ExplorerSortOption,
  PokemonExplorerEntry,
} from "./types";
import { unique } from "./utils/array";

const defaultFilters: ExplorerFilters = {
  query: "",
  favorites: [],
  idealHabitats: [],
  specialties: [],
};

export const explorerDefaultFilters = defaultFilters;

const countMatches = (targetValues: string[], selectedValues: string[]) =>
  selectedValues.filter((value) => targetValues.includes(value)).length;

const habitatFrequency = pokemonExplorerEntries.reduce<Record<string, number>>((accumulator, entry) => {
  accumulator[entry.idealHabitat] = (accumulator[entry.idealHabitat] ?? 0) + 1;
  return accumulator;
}, {});

const favoriteOverlapPotential = (entry: PokemonExplorerEntry) =>
  pokemonExplorerEntries
    .filter((candidate) => candidate.id !== entry.id)
    .reduce((sum, candidate) => {
      const sharedFavorites = entry.favorites.filter((favorite) => candidate.favorites.includes(favorite)).length;
      return sum + sharedFavorites;
    }, 0);

export const getCompatibilityPotential = (entry: PokemonExplorerEntry) =>
  entry.favorites.length * 4 +
  entry.specialties.length * 3 +
  (habitatFrequency[entry.idealHabitat] ?? 0) * 2 +
  favoriteOverlapPotential(entry);

export const matchesExplorerSearch = (entry: PokemonExplorerEntry, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    entry.name,
    String(entry.number),
    entry.idealHabitat,
    ...entry.specialties,
    ...entry.favorites,
    ...entry.favoriteItemCategories,
    ...(entry.tags ?? []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
};

export const filterExplorerEntries = (
  entries: PokemonExplorerEntry[],
  filters: ExplorerFilters,
): PokemonExplorerEntry[] =>
  entries.filter((entry) => {
    if (!matchesExplorerSearch(entry, filters.query)) return false;
    if (filters.favorites.length > 0 && countMatches(entry.favorites, filters.favorites) === 0) return false;
    if (
      filters.idealHabitats.length > 0 &&
      !filters.idealHabitats.includes(entry.idealHabitat)
    ) {
      return false;
    }
    if (filters.specialties.length > 0 && countMatches(entry.specialties, filters.specialties) === 0) return false;
    return true;
  });

export const sortExplorerEntries = (
  entries: PokemonExplorerEntry[],
  sortOption: ExplorerSortOption,
): ExplorerResult[] => {
  const results = entries.map((entry) => ({
    entry,
    compatibilityPotential: getCompatibilityPotential(entry),
  }));

  return results.sort((left, right) => {
    switch (sortOption) {
      case "number-asc":
        return left.entry.number - right.entry.number;
      case "name-asc":
        return left.entry.name.localeCompare(right.entry.name);
      case "name-desc":
        return right.entry.name.localeCompare(left.entry.name);
      case "specialty-count-desc":
        return (
          right.entry.specialties.length - left.entry.specialties.length ||
          left.entry.name.localeCompare(right.entry.name)
        );
      case "favorites-count-desc":
        return (
          right.entry.favorites.length - left.entry.favorites.length ||
          left.entry.name.localeCompare(right.entry.name)
        );
      case "compatibility-potential-desc":
      default:
        return (
          right.compatibilityPotential - left.compatibilityPotential ||
          left.entry.name.localeCompare(right.entry.name)
        );
    }
  });
};

export const getExplorerFilterOptions = (
  entries: PokemonExplorerEntry[],
  getValues: (entry: PokemonExplorerEntry) => string[],
): ExplorerFilterOption[] => {
  const allValues = unique(entries.flatMap(getValues));
  return allValues
    .map((value) => ({
      value,
      label: value,
      count: entries.filter((entry) => getValues(entry).includes(value)).length,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

export const getRelatedPokemon = (entry: PokemonExplorerEntry, limit = 4): ExplorerResult[] =>
  pokemonExplorerEntries
    .filter((candidate) => candidate.id !== entry.id)
    .map((candidate) => {
      const sharedFavorites = entry.favorites.filter((favorite) => candidate.favorites.includes(favorite)).length;
      const sameHabitat = candidate.idealHabitat === entry.idealHabitat ? 3 : 0;
      const sharedSpecialty = entry.specialties.some((specialty) => candidate.specialties.includes(specialty))
        ? 1
        : 0;
      return {
        entry: candidate,
        compatibilityPotential: sharedFavorites * 5 + sameHabitat + sharedSpecialty,
      };
    })
    .sort((left, right) => right.compatibilityPotential - left.compatibilityPotential)
    .slice(0, limit);

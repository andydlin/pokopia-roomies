import {
  favoriteCategoryById,
  habitatTraitById,
  items,
  pokemon,
  specialtyById,
} from "../domain/data";
import type {
  ExplorerFilterOption,
  ExplorerFilters,
  ExplorerResult,
  ExplorerSortOption,
  PokemonExplorerEntry,
} from "./types";
import { unique } from "../lib/utils/array";

const favoriteItemCategoriesForPokemon = (favoriteCategoryIds: string[]) =>
  unique(
    items
      .filter((item) => item.favoriteCategoryIds.some((categoryId) => favoriteCategoryIds.includes(categoryId)))
      .flatMap((item) =>
        item.favoriteCategoryIds
          .filter((categoryId) => favoriteCategoryIds.includes(categoryId))
          .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId),
      ),
  );

export const pokemonExplorerEntries: PokemonExplorerEntry[] = pokemon.map((entry) => ({
  id: entry.id,
  number: entry.dexNumber ?? 0,
  slug: entry.slug,
  name: entry.fullDisplayName,
  image: entry.imageUrl ?? undefined,
  idealHabitat:
    habitatTraitById.get(entry.idealHabitatTraitIds[0])?.label ?? entry.idealHabitatTraitIds[0] ?? "Unknown",
  specialties: entry.specialtyIds.map((specialtyId) => specialtyById.get(specialtyId)?.name ?? specialtyId),
  favorites: entry.favoriteCategoryIds.map(
    (categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId,
  ),
  favoriteItemCategories: favoriteItemCategoriesForPokemon(entry.favoriteCategoryIds),
  tags: unique([
    entry.slug,
    entry.name,
    ...(entry.favoriteCategoryIds.map((categoryId) => favoriteCategoryById.get(categoryId)?.slug ?? categoryId)),
    ...entry.locationIds,
    ...entry.habitatIds,
    ...(items
      .filter((item) => item.favoriteCategoryIds.some((categoryId) => entry.favoriteCategoryIds.includes(categoryId)))
      .map((item) => item.slug)),
  ]),
  notes:
    entry.idealHabitatTraitIds.length > 1
      ? `Planning note: also leans toward ${entry.idealHabitatTraitIds
          .slice(1)
          .map((traitId) => habitatTraitById.get(traitId)?.label ?? traitId)
          .join(", ")} habitats.`
      : undefined,
}));

export const pokemonExplorerBySlug = new Map(
  pokemonExplorerEntries.map((entry) => [entry.slug, entry]),
);

export const favoriteItemCategories = unique(
  pokemonExplorerEntries.flatMap((entry) => entry.favoriteItemCategories),
).sort((left, right) => left.localeCompare(right));

export const explorerFavoriteNames = unique(
  pokemonExplorerEntries.flatMap((entry) => entry.favorites),
).sort((left, right) => left.localeCompare(right));

export const explorerIdealHabitats = unique(
  pokemonExplorerEntries.map((entry) => entry.idealHabitat),
).sort((left, right) => left.localeCompare(right));

export const explorerSpecialties = unique(
  pokemonExplorerEntries.flatMap((entry) => entry.specialties),
).sort((left, right) => left.localeCompare(right));

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
    if (filters.idealHabitats.length > 0 && !filters.idealHabitats.includes(entry.idealHabitat)) {
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

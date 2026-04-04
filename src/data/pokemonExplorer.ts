import { favoriteCategoryById } from "./favoriteCategories";
import { habitatTraitById } from "./habitatTraits";
import { itemById, items } from "./items";
import { pokemon } from "./pokemon";
import { specialtyById } from "./specialties";
import type { PokemonExplorerEntry } from "../lib/types";
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
  name: entry.name,
  image: entry.imageUrl,
  idealHabitat: habitatTraitById.get(entry.idealHabitatTraitIds[0])?.label ?? entry.idealHabitatTraitIds[0] ?? "Unknown",
  specialties: [specialtyById.get(entry.specialtyId)?.name ?? entry.specialtyId],
  favorites: entry.favoriteCategoryIds.map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId),
  favoriteItemCategories: favoriteItemCategoriesForPokemon(entry.favoriteCategoryIds),
  tags: unique([
    entry.slug,
    ...(entry.favoriteCategoryIds.map((categoryId) => favoriteCategoryById.get(categoryId)?.slug ?? categoryId)),
    ...entry.locationIds,
    ...(items
      .filter((item) => item.favoriteCategoryIds.some((categoryId) => entry.favoriteCategoryIds.includes(categoryId)))
      .map((item) => item.slug)),
  ]),
  evolutionFamily: entry.slug,
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

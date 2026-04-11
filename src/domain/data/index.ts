import {
  mapGeneratedFavoriteCategoriesToDomain,
  mapGeneratedHabitatsToDomain,
  mapGeneratedHabitatTraitsToDomain,
  mapGeneratedItemsToDomain,
  mapGeneratedLocationsToDomain,
  mapGeneratedPokemonToDomain,
  mapGeneratedSpecialtiesToDomain,
} from "../mappers/generatedToDomain";
import { validatePokemonCollection } from "../validation/pokemon";

export const habitatTraits = mapGeneratedHabitatTraitsToDomain();
export const favoriteCategories = mapGeneratedFavoriteCategoriesToDomain();
export const habitats = mapGeneratedHabitatsToDomain();
export const items = mapGeneratedItemsToDomain();
export const favoriteItems = items.filter((entry) => entry.favoriteCategoryIds.length > 0);
export const nonFavoriteItems = items.filter((entry) => entry.favoriteCategoryIds.length === 0);
export const specialties = mapGeneratedSpecialtiesToDomain();
export const locations = mapGeneratedLocationsToDomain();
export const pokemon = mapGeneratedPokemonToDomain();

validatePokemonCollection({
  pokemon,
  habitatTraits,
  habitats,
  locations,
  specialties,
  favoriteCategories,
  items,
});

export const habitatTraitById = new Map(habitatTraits.map((entry) => [entry.id, entry]));
export const favoriteCategoryById = new Map(favoriteCategories.map((entry) => [entry.id, entry]));
export const favoriteCategoryBySlug = new Map(favoriteCategories.map((entry) => [entry.slug, entry]));
export const habitatById = new Map(habitats.map((entry) => [entry.id, entry]));
export const habitatBySlug = new Map(habitats.map((entry) => [entry.slug, entry]));
export const itemById = new Map(items.map((entry) => [entry.id, entry]));
export const itemBySlug = new Map(items.map((entry) => [entry.slug, entry]));
export const specialtyById = new Map(specialties.map((entry) => [entry.id, entry]));
export const locationById = new Map(locations.map((entry) => [entry.id, entry]));
export const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
export const pokemonBySlug = new Map(pokemon.map((entry) => [entry.slug, entry]));

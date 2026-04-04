import { generatedPokemon } from "./generated/pokemon";
import type { Pokemon } from "../lib/types";

export const pokemon: Pokemon[] = generatedPokemon.map((entry) => ({
  id: entry.id,
  dexNumber: entry.dexNumber,
  name: entry.name,
  slug: entry.id,
  specialtyId: entry.specialties[0] ?? "unknown",
  favoriteCategoryIds: [...entry.favorites],
  idealHabitatTraitIds: [...(entry.habitats.length > 0 ? entry.habitats : [entry.idealHabitat])],
  locationIds: [...entry.locations],
  imageUrl: entry.imageUrl,
}));
export const pokemonById = new Map(pokemon.map((entry) => [entry.id, entry]));
export const pokemonBySlug = new Map(pokemon.map((entry) => [entry.slug, entry]));

import { pokemonById } from "../../domain/data";
import type { TeamResolution } from "../../domain/types";

export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 6;

export const resolveTeamMembers = (pokemonIds: string[]): TeamResolution => {
  const members = [];
  const missingPokemonIds = [];

  for (const pokemonId of pokemonIds) {
    const pokemon = pokemonById.get(pokemonId);
    if (pokemon) {
      members.push(pokemon);
    } else {
      missingPokemonIds.push(pokemonId);
    }
  }

  return {
    members,
    missingPokemonIds,
  };
};

export const getTeamMembers = (pokemonIds: string[]) => resolveTeamMembers(pokemonIds).members;

export const canSaveTeam = (pokemonIds: string[]) =>
  pokemonIds.length >= MIN_TEAM_SIZE && pokemonIds.length <= MAX_TEAM_SIZE;

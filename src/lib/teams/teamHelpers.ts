import { pokemonById } from "../../data/pokemon";
import type { Pokemon } from "../types";

export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 5;

export const getTeamMembers = (pokemonIds: string[]): Pokemon[] =>
  pokemonIds
    .map((pokemonId) => pokemonById.get(pokemonId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

export const canSaveTeam = (pokemonIds: string[]) =>
  pokemonIds.length >= MIN_TEAM_SIZE && pokemonIds.length <= MAX_TEAM_SIZE;

export type ID = string;

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

export interface FavoriteCategory {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  itemIds: ID[];
}

export interface Item {
  id: ID;
  name: string;
  slug: string;
  favoriteCategoryIds: ID[];
  habitatTraitIds?: ID[];
  craftable: boolean;
}

export interface HabitatTrait {
  id: ID;
  axis: string;
  value: string;
  label: string;
  oppositeTraitId?: ID;
}

export interface PairScoreBreakdown {
  pokemonAId: ID;
  pokemonBId: ID;
  sharedFavoriteCategoryIds: ID[];
  matchingHabitatTraitIds: ID[];
  conflictingHabitatPairs: Array<{ traitAId: ID; traitBId: ID }>;
  specialtyModifier: number;
  score: number;
}

export interface TeamScoreBreakdown {
  teamPokemonIds: ID[];
  pairBreakdowns: PairScoreBreakdown[];
  sharedFavoriteCategoryIdsAll: ID[];
  sharedFavoriteCategoryIdsAny: ID[];
  matchingHabitatTraitIdsAll: ID[];
  conflictingHabitatPairs: Array<{
    pokemonAId: ID;
    pokemonBId: ID;
    traitAId: ID;
    traitBId: ID;
  }>;
  recommendedFavoriteCategoryIds: ID[];
  recommendedItemIds: ID[];
  totalScore: number;
  summaryLabel: "excellent" | "good" | "mixed" | "poor";
}

export const SCORE_WEIGHTS = {
  SHARED_FAVORITE_PER_CATEGORY: 8,
  MATCHING_HABITAT_TRAIT: 4,
  CONFLICTING_HABITAT_TRAIT: -6,
  SAME_SPECIALTY: 1,
  ALL_TEAM_SHARED_FAVORITE_BONUS: 6,
  ALL_TEAM_SHARED_HABITAT_BONUS: 4,
  ITEM_COVERAGE_PER_MATCHED_POKEMON: 3,
  CRAFTABLE_ITEM_BONUS: 1,
} as const;

export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((value) => setB.has(value));
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function getOppositeTraitMap(habitatTraits: HabitatTrait[]) {
  return new Map(habitatTraits.map((t) => [t.id, t.oppositeTraitId]));
}

export function getSharedFavorites(pokemon: Pokemon[]): ID[] {
  if (!pokemon.length) return [];
  return pokemon
    .map((p) => p.favoriteCategoryIds)
    .reduce((acc, ids) => intersection(acc, ids));
}

export function getSharedFavoritesAny(pokemon: Pokemon[]): ID[] {
  const counts = new Map<ID, number>();
  for (const p of pokemon) {
    for (const id of p.favoriteCategoryIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([id]) => id);
}

export function getConflictingHabitatPairs(
  a: Pokemon,
  b: Pokemon,
  habitatTraits: HabitatTrait[]
): Array<{ traitAId: ID; traitBId: ID }> {
  const oppositeMap = getOppositeTraitMap(habitatTraits);
  const bSet = new Set(b.idealHabitatTraitIds);
  const conflicts: Array<{ traitAId: ID; traitBId: ID }> = [];
  for (const traitAId of a.idealHabitatTraitIds) {
    const opposite = oppositeMap.get(traitAId);
    if (opposite && bSet.has(opposite)) {
      conflicts.push({ traitAId, traitBId: opposite });
    }
  }
  return conflicts;
}

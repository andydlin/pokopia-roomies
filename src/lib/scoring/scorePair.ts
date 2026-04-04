import type { PairScoreBreakdown, Pokemon } from "../types";
import { SCORE_WEIGHTS } from "./constants";
import { getPairHabitatConflicts } from "../data/selectors";
import { intersection } from "../utils/array";

export const scorePair = (a: Pokemon, b: Pokemon): PairScoreBreakdown => {
  const sharedFavoriteCategoryIds = intersection(a.favoriteCategoryIds, b.favoriteCategoryIds);
  const matchingHabitatTraitIds = intersection(a.idealHabitatTraitIds, b.idealHabitatTraitIds);
  const conflictingHabitatPairs = getPairHabitatConflicts(a, b);
  const specialtyModifier =
    a.specialtyId === b.specialtyId ? SCORE_WEIGHTS.SAME_SPECIALTY : SCORE_WEIGHTS.DIFFERENT_SPECIALTY;

  const score =
    sharedFavoriteCategoryIds.length * SCORE_WEIGHTS.SHARED_FAVORITE_PER_CATEGORY +
    matchingHabitatTraitIds.length * SCORE_WEIGHTS.MATCHING_HABITAT_TRAIT +
    conflictingHabitatPairs.length * SCORE_WEIGHTS.CONFLICTING_HABITAT_TRAIT +
    specialtyModifier;

  return {
    pokemonAId: a.id,
    pokemonBId: b.id,
    sharedFavoriteCategoryIds,
    matchingHabitatTraitIds,
    conflictingHabitatPairs,
    specialtyModifier,
    score,
  };
};

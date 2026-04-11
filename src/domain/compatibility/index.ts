import {
  favoriteCategoryById,
  habitatById,
  habitatTraitById,
  itemById,
  specialtyById,
} from "../data";
import {
  getHabitatConflicts,
  getHabitatCoverageBreakdown,
  getBestHabitatsForTeam,
  getMatchingHabitatTraitsAll,
  getRecommendedCategoriesForHabitat,
  getRecommendedItemsForHabitat,
  getRecommendedCategories,
  getRecommendedItems,
  getSharedFavoriteCategories,
  getSharedFavoriteCategoriesAny,
  getSharedHabitats,
  getPairHabitatConflicts,
} from "../selectors";
import type { ID, PairScoreBreakdown, Pokemon, SummaryLabel, TeamScoreBreakdown } from "../types";
import { intersection } from "../../lib/utils/array";
import { SCORE_WEIGHTS } from "../../lib/scoring/constants";

const getSummaryLabel = (score: number): SummaryLabel => {
  if (score >= 18) return "excellent";
  if (score >= 10) return "good";
  if (score >= 3) return "mixed";
  return "poor";
};

export const scorePair = (a: Pokemon, b: Pokemon): PairScoreBreakdown => {
  const sharedFavoriteCategoryIds = intersection(a.favoriteCategoryIds, b.favoriteCategoryIds);
  const sharedHabitatIds = intersection(a.habitatIds, b.habitatIds);
  const sharedIdealHabitatTraitIds = intersection(a.idealHabitatTraitIds, b.idealHabitatTraitIds);
  const sharedSpecialtyIds = intersection(a.specialtyIds, b.specialtyIds);
  const conflictingHabitatPairs = getPairHabitatConflicts(a, b);
  const specialtyModifier =
    sharedSpecialtyIds.length > 0 ? SCORE_WEIGHTS.SAME_SPECIALTY : SCORE_WEIGHTS.DIFFERENT_SPECIALTY;

  const score =
    sharedFavoriteCategoryIds.length * SCORE_WEIGHTS.SHARED_FAVORITE_PER_CATEGORY +
    sharedIdealHabitatTraitIds.length * SCORE_WEIGHTS.MATCHING_HABITAT_TRAIT +
    conflictingHabitatPairs.length * SCORE_WEIGHTS.CONFLICTING_HABITAT_TRAIT +
    specialtyModifier;

  const explanation: string[] = [];
  if (sharedFavoriteCategoryIds.length > 0) {
    explanation.push(
      `Shared favorites: ${sharedFavoriteCategoryIds
        .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId)
        .join(", ")}.`,
    );
  }
  if (sharedIdealHabitatTraitIds.length > 0) {
    explanation.push(
      `Shared ideal habitat traits: ${sharedIdealHabitatTraitIds
        .map((traitId) => habitatTraitById.get(traitId)?.label ?? traitId)
        .join(", ")}.`,
    );
  }
  if (sharedHabitatIds.length > 0) {
    explanation.push(
      `Shared habitats: ${sharedHabitatIds
        .map((habitatId) => habitatById.get(habitatId)?.name ?? habitatId)
        .join(", ")}.`,
    );
  }
  if (sharedSpecialtyIds.length > 0) {
    explanation.push(
      `Shared specialties: ${sharedSpecialtyIds
        .map((specialtyId) => specialtyById.get(specialtyId)?.name ?? specialtyId)
        .join(", ")}.`,
    );
  }

  return {
    pokemonAId: a.id,
    pokemonBId: b.id,
    sharedFavoriteCategoryIds,
    sharedHabitatIds,
    sharedIdealHabitatTraitIds,
    matchingHabitatTraitIds: sharedIdealHabitatTraitIds,
    sharedSpecialtyIds,
    conflictingHabitatPairs,
    specialtyModifier,
    score,
    explanation,
  };
};

export const scoreTeam = (
  group: Pokemon[],
  options?: { habitatId?: ID | null },
): TeamScoreBreakdown => {
  const pairBreakdowns = [];
  for (let index = 0; index < group.length; index += 1) {
    for (let inner = index + 1; inner < group.length; inner += 1) {
      pairBreakdowns.push(scorePair(group[index], group[inner]));
    }
  }

  const pairCount = pairBreakdowns.length;
  const rawPairTotal = pairBreakdowns.reduce((sum, pair) => sum + pair.score, 0);
  const sharedFavoriteCategoryIdsAll = getSharedFavoriteCategories(group);
  const sharedFavoriteCategoryIdsAny = getSharedFavoriteCategoriesAny(group);
  const sharedHabitatIdsAll = getSharedHabitats(group);
  const matchingHabitatTraitIdsAll = getMatchingHabitatTraitsAll(group);
  const conflictingHabitatPairs = getHabitatConflicts(group);
  const selectedHabitatId =
    options?.habitatId ?? getBestHabitatsForTeam(group)[0]?.habitatId ?? null;
  const habitatCoverage = selectedHabitatId ? getHabitatCoverageBreakdown(group, selectedHabitatId) : null;
  const recommendedCategories = selectedHabitatId
    ? getRecommendedCategoriesForHabitat(group, selectedHabitatId)
    : getRecommendedCategories(group);
  const recommendedItems = selectedHabitatId
    ? getRecommendedItemsForHabitat(group, selectedHabitatId)
    : getRecommendedItems(group);
  const allSharedFavoriteBonus =
    sharedFavoriteCategoryIdsAll.length * SCORE_WEIGHTS.ALL_TEAM_SHARED_FAVORITE_BONUS;
  const allSharedHabitatBonus =
    matchingHabitatTraitIdsAll.length * SCORE_WEIGHTS.ALL_TEAM_SHARED_HABITAT_BONUS;
  const habitatSupportBonus = habitatCoverage?.score ?? 0;
  const totalScore =
    pairCount === 0
      ? habitatSupportBonus
      : Math.round(rawPairTotal / pairCount + allSharedFavoriteBonus + allSharedHabitatBonus + habitatSupportBonus);

  const explanation: string[] = [];
  if (sharedFavoriteCategoryIdsAll.length > 0) {
    explanation.push(
      `Everyone overlaps on ${sharedFavoriteCategoryIdsAll
        .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId)
        .join(", ")}.`,
    );
  }
  if (matchingHabitatTraitIdsAll.length > 0) {
    explanation.push(
      `The whole team agrees on ${matchingHabitatTraitIdsAll
        .map((traitId) => habitatTraitById.get(traitId)?.label ?? traitId)
        .join(", ")} ideal habitat traits.`,
    );
  }
  if (sharedHabitatIdsAll.length > 0) {
    explanation.push(
      `Shared habitats for the whole team: ${sharedHabitatIdsAll
        .map((habitatId) => habitatById.get(habitatId)?.name ?? habitatId)
        .join(", ")}.`,
    );
  }
  if (habitatCoverage && selectedHabitatId) {
    explanation.push(
      `Planning habitat: ${habitatById.get(selectedHabitatId)?.name ?? selectedHabitatId}. ${habitatCoverage.stronglySupportedPokemonIds.length}/${group.length} Pokemon get strong support from habitat-fit recommendations (${Math.round(habitatCoverage.averagePokemonCoverageRatio * 100)}% average favorite-category coverage).`,
    );
  }
  if (conflictingHabitatPairs.length > 0) {
    explanation.push(
      `${conflictingHabitatPairs.length} direct habitat conflict${
        conflictingHabitatPairs.length === 1 ? "" : "s"
      } need attention.`,
    );
  }
  if (recommendedItems[0]) {
    explanation.push(`Top item recommendation: ${itemById.get(recommendedItems[0].itemId)?.name ?? recommendedItems[0].itemId}.`);
  }

  return {
    teamPokemonIds: group.map((entry) => entry.id),
    pairBreakdowns,
    sharedFavoriteCategoryIdsAll,
    sharedFavoriteCategoryIdsAny,
    sharedHabitatIdsAll,
    matchingHabitatTraitIdsAll,
    conflictingHabitatPairs,
    selectedHabitatId,
    habitatCoverage,
    recommendedFavoriteCategoryIds: recommendedCategories.map((entry) => entry.categoryId),
    recommendedItemIds: recommendedItems.map((entry) => entry.itemId),
    totalScore,
    summaryLabel: getSummaryLabel(totalScore),
    rawPairTotal,
    pairCount,
    allSharedFavoriteBonus,
    allSharedHabitatBonus,
    habitatSupportBonus,
    explanation,
  };
};

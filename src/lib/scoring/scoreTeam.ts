import { favoriteCategoryById } from "../../data/favoriteCategories";
import { habitatTraitById } from "../../data/habitatTraits";
import { itemById } from "../../data/items";
import type { Pokemon, SummaryLabel, TeamScoreBreakdown } from "../types";
import { getHabitatConflicts, getMatchingHabitatTraitsAll, getRecommendedCategories, getRecommendedItems, getSharedFavoriteCategories, getSharedFavoriteCategoriesAny } from "../data/selectors";
import { scorePair } from "./scorePair";
import { SCORE_WEIGHTS } from "./constants";

const getSummaryLabel = (score: number): SummaryLabel => {
  if (score >= 18) return "excellent";
  if (score >= 10) return "good";
  if (score >= 3) return "mixed";
  return "poor";
};

export const scoreTeam = (group: Pokemon[]): TeamScoreBreakdown => {
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
  const matchingHabitatTraitIdsAll = getMatchingHabitatTraitsAll(group);
  const conflictingHabitatPairs = getHabitatConflicts(group);
  const recommendedCategories = getRecommendedCategories(group);
  const recommendedItems = getRecommendedItems(group);
  const allSharedFavoriteBonus =
    sharedFavoriteCategoryIdsAll.length * SCORE_WEIGHTS.ALL_TEAM_SHARED_FAVORITE_BONUS;
  const allSharedHabitatBonus =
    matchingHabitatTraitIdsAll.length * SCORE_WEIGHTS.ALL_TEAM_SHARED_HABITAT_BONUS;
  const totalScore =
    pairCount === 0
      ? 0
      : Math.round(rawPairTotal / pairCount + allSharedFavoriteBonus + allSharedHabitatBonus);

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
        .join(", ")} habitat traits.`,
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
    matchingHabitatTraitIdsAll,
    conflictingHabitatPairs,
    recommendedFavoriteCategoryIds: recommendedCategories.map((entry) => entry.categoryId),
    recommendedItemIds: recommendedItems.map((entry) => entry.itemId),
    totalScore,
    summaryLabel: getSummaryLabel(totalScore),
    rawPairTotal,
    pairCount,
    allSharedFavoriteBonus,
    allSharedHabitatBonus,
    explanation,
  };
};

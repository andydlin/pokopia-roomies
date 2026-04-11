import {
  favoriteCategories,
  favoriteCategoryById,
  habitatById,
  habitats,
  habitatTraitById,
  habitatTraits,
  itemById,
  items,
  pokemon,
  pokemonById,
  specialtyById,
} from "../data";
import type {
  FavoriteCategory,
  HabitatCoverageBreakdown,
  Item,
  ItemRecommendation,
  PairHabitatConflict,
  Pokemon,
  RecommendedCategory,
  TeamConflict,
} from "../types";
import { SCORE_WEIGHTS } from "../../lib/scoring/constants";
import { intersection, unique } from "../../lib/utils/array";
import {
  getFavoriteCategoryName,
  getHabitatTraitLabel,
  getItemName,
  getSpecialtyName,
} from "../../lib/utils/labels";
import type { LookupFilters, LookupMatch, TeamStyleSummary } from "../../view-models/types";

const oppositeTraitMap = new Map(habitatTraits.map((trait) => [trait.id, trait.oppositeTraitId]));

export const getSharedFavoriteCategories = (group: Pokemon[]): string[] => {
  if (group.length === 0) return [];
  return group
    .map((entry) => entry.favoriteCategoryIds)
    .reduce((accumulator, current) => intersection(accumulator, current));
};

export const getSharedFavoriteCategoriesAny = (group: Pokemon[]): string[] => {
  const counts = new Map<string, number>();
  group.forEach((entry) => {
    unique(entry.favoriteCategoryIds).forEach((categoryId) => {
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([categoryId]) => categoryId);
};

export const getSharedHabitats = (group: Pokemon[]): string[] => {
  if (group.length === 0) return [];
  return group
    .map((entry) => entry.habitatIds)
    .reduce((accumulator, current) => intersection(accumulator, current));
};

export const getItemsForFavoriteCategory = (categoryId: string): Item[] =>
  favoriteCategoryById
    .get(categoryId)
    ?.itemIds.map((itemId) => itemById.get(itemId))
    .filter((item): item is Item => Boolean(item)) ?? [];

export const getFavoriteCategoriesForPokemon = (entry: Pokemon): FavoriteCategory[] =>
  entry.favoriteCategoryIds
    .map((categoryId) => favoriteCategoryById.get(categoryId))
    .filter((category): category is FavoriteCategory => Boolean(category));

export const getFavoriteItemsForPokemon = (entry: Pokemon): Item[] => {
  const seen = new Map<string, Item>();
  entry.favoriteCategoryIds.forEach((categoryId) => {
    getItemsForFavoriteCategory(categoryId).forEach((item) => {
      seen.set(item.id, item);
    });
  });
  return [...seen.values()];
};

export const getPokemonByFavoriteCategory = (categoryId: string) =>
  pokemon.filter((entry) => entry.favoriteCategoryIds.includes(categoryId));

export const getPokemonForItem = (itemId: string) => {
  const item = itemById.get(itemId);
  if (!item) return [];
  return pokemon.filter((entry) =>
    entry.favoriteCategoryIds.some((categoryId) => item.favoriteCategoryIds.includes(categoryId)),
  );
};

export const getItemById = (itemId: string) => itemById.get(itemId) ?? null;
export const getCategoryById = (categoryId: string) => favoriteCategoryById.get(categoryId) ?? null;

export const getPairHabitatConflicts = (a: Pokemon, b: Pokemon): PairHabitatConflict[] => {
  const bTraits = new Set(b.idealHabitatTraitIds);
  const conflicts: PairHabitatConflict[] = [];

  a.idealHabitatTraitIds.forEach((traitAId) => {
    const oppositeId = oppositeTraitMap.get(traitAId);
    if (oppositeId && bTraits.has(oppositeId)) {
      conflicts.push({ traitAId, traitBId: oppositeId });
    }
  });

  return conflicts;
};

export const getHabitatConflicts = (group: Pokemon[]): TeamConflict[] => {
  const conflicts: TeamConflict[] = [];
  for (let index = 0; index < group.length; index += 1) {
    for (let inner = index + 1; inner < group.length; inner += 1) {
      getPairHabitatConflicts(group[index], group[inner]).forEach((conflict) => {
        conflicts.push({
          pokemonAId: group[index].id,
          pokemonBId: group[inner].id,
          traitAId: conflict.traitAId,
          traitBId: conflict.traitBId,
        });
      });
    }
  }
  return conflicts;
};

export const getRecommendedCategories = (group: Pokemon[]): RecommendedCategory[] => {
  if (group.length === 0) return [];

  const selectedIds = new Set(group.map((entry) => entry.id));

  return favoriteCategories
    .map((category) => {
      const matchedPokemonIds = group
        .filter((entry) => entry.favoriteCategoryIds.includes(category.id))
        .map((entry) => entry.id)
        .filter((pokemonId) => selectedIds.has(pokemonId));
      const score = matchedPokemonIds.length * 100 + category.itemIds.length;
      return {
        categoryId: category.id,
        matchedPokemonIds,
        itemCount: category.itemIds.length,
        score,
        reasons: [
          `Matches ${matchedPokemonIds.length}/${group.length} selected Pokemon.`,
          `${category.itemIds.length} mapped item${category.itemIds.length === 1 ? "" : "s"} in this category.`,
        ],
      };
    })
    .filter((entry) => entry.matchedPokemonIds.length > 0)
    .sort((left, right) => right.score - left.score || left.categoryId.localeCompare(right.categoryId));
};

export const getRecommendedItems = (group: Pokemon[]): ItemRecommendation[] => {
  if (group.length === 0) return [];

  return items
    .map((item) => {
      const matchedPokemonIds = group
        .filter((entry) =>
          entry.favoriteCategoryIds.some((categoryId) => item.favoriteCategoryIds.includes(categoryId)),
        )
        .map((entry) => entry.id);

      const matchedFavoriteCategoryIds = unique(
        group.flatMap((entry) =>
          entry.favoriteCategoryIds.filter((categoryId) => item.favoriteCategoryIds.includes(categoryId)),
        ),
      );

      const score =
        matchedPokemonIds.length * SCORE_WEIGHTS.ITEM_COVERAGE_PER_MATCHED_POKEMON +
        (item.craftable ? SCORE_WEIGHTS.CRAFTABLE_ITEM_BONUS : 0);

      return {
        itemId: item.id,
        matchedPokemonIds,
        matchedFavoriteCategoryIds,
        habitatId: null,
        score,
        reasons: [
          `Matches ${matchedPokemonIds.length}/${group.length} selected Pokemon.`,
          item.craftable ? "Craftable item." : "Known source item.",
        ],
      };
    })
    .filter((recommendation) => recommendation.matchedPokemonIds.length > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.matchedPokemonIds.length - left.matchedPokemonIds.length ||
        getItemName(left.itemId).localeCompare(getItemName(right.itemId)),
    );
};

export const findPokemonMatches = (filters: LookupFilters): LookupMatch[] =>
  pokemon
    .map((entry) => {
      const reasons: string[] = [];

      if (
        filters.query &&
        ![entry.name, entry.fullDisplayName, entry.slug, String(entry.dexNumber ?? "")]
          .join(" ")
          .toLowerCase()
          .includes(filters.query.toLowerCase())
      ) {
        return null;
      }

      if (filters.favoriteCategoryId !== "all") {
        if (!entry.favoriteCategoryIds.includes(filters.favoriteCategoryId)) {
          return null;
        }
        reasons.push(`Likes ${getFavoriteCategoryName(filters.favoriteCategoryId)}`);
      }

      if (filters.itemId !== "all") {
        const item = itemById.get(filters.itemId);
        if (
          !item ||
          !entry.favoriteCategoryIds.some((categoryId) => item.favoriteCategoryIds.includes(categoryId))
        ) {
          return null;
        }
        reasons.push(`Benefits from ${item.name}`);
      }

      if (filters.comfortCategoryId !== "all") {
        if (filters.itemId !== "all") {
          const selectedItem = itemById.get(filters.itemId);
          if (!selectedItem || !selectedItem.comfortCategoryIds.includes(filters.comfortCategoryId)) {
            return null;
          }
        }

        const matchingComfortItems = items.filter(
          (item) =>
            item.comfortCategoryIds.includes(filters.comfortCategoryId) &&
            item.favoriteCategoryIds.some((categoryId) => entry.favoriteCategoryIds.includes(categoryId)),
        );

        if (matchingComfortItems.length === 0) {
          return null;
        }

        const label = filters.comfortCategoryId
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
        reasons.push(`Comfort tag: ${label}`);
      }

      if (filters.habitatTraitId !== "all") {
        if (!entry.idealHabitatTraitIds.includes(filters.habitatTraitId)) {
          return null;
        }
        reasons.push(`Prefers ${getHabitatTraitLabel(filters.habitatTraitId)}`);
      }

      if (filters.specialtyId !== "all") {
        if (!entry.specialtyIds.includes(filters.specialtyId)) {
          return null;
        }
        reasons.push(`Specialty: ${getSpecialtyName(filters.specialtyId)}`);
      }

      return {
        pokemonId: entry.id,
        reasons,
      };
    })
    .filter((match): match is LookupMatch => Boolean(match));

export const getMatchingHabitatTraitsAll = (group: Pokemon[]) => {
  if (group.length === 0) return [];
  return group
    .map((entry) => entry.idealHabitatTraitIds)
    .reduce((accumulator, current) => intersection(accumulator, current));
};

export const getHabitatFitItems = (habitatId: string): Item[] => {
  const habitat = habitatById.get(habitatId);
  if (!habitat) return [];

  return items
    .filter((item) => item.habitatTraitIds.some((traitId) => habitat.traitIds.includes(traitId)))
    .sort((left, right) => {
      const leftShared = left.habitatTraitIds.filter((traitId) => habitat.traitIds.includes(traitId)).length;
      const rightShared = right.habitatTraitIds.filter((traitId) => habitat.traitIds.includes(traitId)).length;
      return rightShared - leftShared || left.name.localeCompare(right.name);
    });
};

export const getRecommendedCategoriesForHabitat = (
  group: Pokemon[],
  habitatId: string,
): RecommendedCategory[] => {
  if (group.length === 0) return [];

  const habitatFitItems = getHabitatFitItems(habitatId);
  const habitatFitItemIdsByCategory = new Map<string, string[]>();

  habitatFitItems.forEach((item) => {
    item.favoriteCategoryIds.forEach((categoryId) => {
      const current = habitatFitItemIdsByCategory.get(categoryId) ?? [];
      current.push(item.id);
      habitatFitItemIdsByCategory.set(categoryId, current);
    });
  });

  return favoriteCategories
    .map((category) => {
      const matchedPokemonIds = group
        .filter((entry) => entry.favoriteCategoryIds.includes(category.id))
        .map((entry) => entry.id);
      const habitatFitItemIds = habitatFitItemIdsByCategory.get(category.id) ?? [];
      const score = matchedPokemonIds.length * 100 + habitatFitItemIds.length * 10;
      return {
        categoryId: category.id,
        matchedPokemonIds,
        itemCount: habitatFitItemIds.length,
        score,
        reasons: [
          `Matches ${matchedPokemonIds.length}/${group.length} selected Pokemon for this habitat.`,
          `${habitatFitItemIds.length} habitat-fit item${habitatFitItemIds.length === 1 ? "" : "s"} support this category here.`,
        ],
      };
    })
    .filter((entry) => entry.matchedPokemonIds.length > 0 && entry.itemCount > 0)
    .sort((left, right) => right.score - left.score || left.categoryId.localeCompare(right.categoryId));
};

export const getRecommendedItemsForHabitat = (
  group: Pokemon[],
  habitatId: string,
): ItemRecommendation[] => {
  if (group.length === 0) return [];

  const habitat = habitatById.get(habitatId);
  if (!habitat) return [];

  return getHabitatFitItems(habitatId)
    .map((item) => {
      const matchedPokemonIds = group
        .filter((entry) =>
          entry.favoriteCategoryIds.some((categoryId) => item.favoriteCategoryIds.includes(categoryId)),
        )
        .map((entry) => entry.id);
      const matchedFavoriteCategoryIds = unique(
        group.flatMap((entry) =>
          entry.favoriteCategoryIds.filter((categoryId) => item.favoriteCategoryIds.includes(categoryId)),
        ),
      );
      const sharedTraitIds = item.habitatTraitIds.filter((traitId) => habitat.traitIds.includes(traitId));
      const score =
        matchedPokemonIds.length * SCORE_WEIGHTS.ITEM_COVERAGE_PER_MATCHED_POKEMON +
        sharedTraitIds.length * 2;

      return {
        itemId: item.id,
        matchedPokemonIds,
        matchedFavoriteCategoryIds,
        habitatId,
        score,
        reasons: [
          `Recommended for ${habitat.name} through ${sharedTraitIds
            .map((traitId) => habitatTraitById.get(traitId)?.label ?? traitId)
            .join(", ")} fit.`,
          `Matches ${matchedPokemonIds.length}/${group.length} selected Pokemon.`,
        ],
      };
    })
    .filter((recommendation) => recommendation.matchedPokemonIds.length > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.matchedPokemonIds.length - left.matchedPokemonIds.length ||
        getItemName(left.itemId).localeCompare(getItemName(right.itemId)),
    );
};

export const getHabitatCoverageBreakdown = (
  group: Pokemon[],
  habitatId: string,
): HabitatCoverageBreakdown => {
  const habitat = habitatById.get(habitatId);
  if (!habitat) {
    return {
      habitatId,
      habitatFitItemIds: [],
      matchedItemIds: [],
      matchedFavoriteCategoryIds: [],
      stronglySupportedPokemonIds: [],
      weaklySupportedPokemonIds: group.map((entry) => entry.id),
      pokemonCoverage: group.map((entry) => ({
        pokemonId: entry.id,
        coveredFavoriteCategoryIds: [],
        coverageRatio: 0,
      })),
      averagePokemonCoverageRatio: 0,
      preferredPokemonIds: [],
      supportedPokemonRatio: 0,
      categoryCoverageRatio: 0,
      efficiencyRatio: 0,
      score: 0,
      explanation: ["Unknown habitat."],
    };
  }

  const habitatFitItems = getHabitatFitItems(habitatId);
  const recommendedItems = getRecommendedItemsForHabitat(group, habitatId);
  const matchedItemIds = recommendedItems.map((entry) => entry.itemId);
  const matchedFavoriteCategoryIds = unique(
    recommendedItems.flatMap((entry) => entry.matchedFavoriteCategoryIds),
  );
  const pokemonCoverage = group.map((entry) => {
    const favoriteCategoryIds = unique(entry.favoriteCategoryIds);
    const coveredFavoriteCategoryIds = favoriteCategoryIds.filter((categoryId) =>
      habitatFitItems.some((item) => item.favoriteCategoryIds.includes(categoryId)),
    );
    const coverageRatio =
      favoriteCategoryIds.length === 0 ? 0 : coveredFavoriteCategoryIds.length / favoriteCategoryIds.length;
    return {
      pokemonId: entry.id,
      coveredFavoriteCategoryIds,
      coverageRatio,
    };
  });
  const stronglySupportedPokemonIds = pokemonCoverage
    .filter((entry) => entry.coverageRatio >= 0.5)
    .map((entry) => entry.pokemonId);
  const weaklySupportedPokemonIds = group
    .map((entry) => entry.id)
    .filter((pokemonId) => !stronglySupportedPokemonIds.includes(pokemonId));
  const averagePokemonCoverageRatio =
    pokemonCoverage.length === 0
      ? 0
      : pokemonCoverage.reduce((sum, entry) => sum + entry.coverageRatio, 0) / pokemonCoverage.length;
  const preferredPokemonIds = group
    .filter((entry) => entry.idealHabitatTraitIds.some((traitId) => habitat.traitIds.includes(traitId)))
    .map((entry) => entry.id);
  const groupFavoriteCategoryIds = unique(group.flatMap((entry) => entry.favoriteCategoryIds));
  const supportedPokemonRatio = group.length === 0 ? 0 : stronglySupportedPokemonIds.length / group.length;
  const categoryCoverageRatio =
    groupFavoriteCategoryIds.length === 0 ? 0 : matchedFavoriteCategoryIds.length / groupFavoriteCategoryIds.length;
  const efficiencyRatio = habitatFitItems.length === 0 ? 0 : matchedItemIds.length / habitatFitItems.length;
  const weakCoverage = averagePokemonCoverageRatio < 0.2;
  const allStronglySupported = group.length > 0 && stronglySupportedPokemonIds.length === group.length;

  const score =
    stronglySupportedPokemonIds.length * SCORE_WEIGHTS.HABITAT_ITEM_SATISFACTION_PER_MATCHED_POKEMON +
    preferredPokemonIds.length * SCORE_WEIGHTS.HABITAT_PREFERENCE_PER_MATCHED_POKEMON +
    Math.round(
      averagePokemonCoverageRatio *
        SCORE_WEIGHTS.HABITAT_CATEGORY_COVERAGE_MAX_BONUS,
    ) +
    Math.round(categoryCoverageRatio * SCORE_WEIGHTS.HABITAT_CATEGORY_COVERAGE_MAX_BONUS) +
    Math.round(efficiencyRatio * SCORE_WEIGHTS.HABITAT_ITEM_POOL_EFFICIENCY_MAX_BONUS) +
    (allStronglySupported
      ? SCORE_WEIGHTS.HABITAT_FULL_TEAM_SATISFACTION_BONUS
      : 0) +
    (weakCoverage ? SCORE_WEIGHTS.WEAK_HABITAT_ITEM_POOL_PENALTY : 0);

  const explanation: string[] = [
    `${habitatFitItems.length} habitat-fit item${habitatFitItems.length === 1 ? "" : "s"} are recommended for ${habitat.name}.`,
    `${stronglySupportedPokemonIds.length}/${group.length} selected Pokemon have strong support (50%+ favorite-category coverage).`,
    `Average per-Pokemon category coverage: ${Math.round(averagePokemonCoverageRatio * 100)}%.`,
  ];
  if (matchedFavoriteCategoryIds.length > 0) {
    explanation.push(
      `Covered favorite categories: ${matchedFavoriteCategoryIds
        .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId)
        .slice(0, 4)
        .join(", ")}${matchedFavoriteCategoryIds.length > 4 ? "..." : ""}.`,
    );
  }
  if (preferredPokemonIds.length > 0) {
    explanation.push(
      `${preferredPokemonIds.length}/${group.length} selected Pokemon also match this habitat's ideal-trait profile.`,
    );
  }
  if (weakCoverage) {
    explanation.push("This habitat has weak support for the current team.");
  }

  return {
    habitatId,
    habitatFitItemIds: habitatFitItems.map((item) => item.id),
    matchedItemIds,
    matchedFavoriteCategoryIds,
    stronglySupportedPokemonIds,
    weaklySupportedPokemonIds,
    pokemonCoverage,
    averagePokemonCoverageRatio,
    preferredPokemonIds,
    supportedPokemonRatio,
    categoryCoverageRatio,
    efficiencyRatio,
    score,
    explanation,
  };
};

export const getBestHabitatsForTeam = (group: Pokemon[]): HabitatCoverageBreakdown[] =>
  habitats
    .map((habitat) => getHabitatCoverageBreakdown(group, habitat.id))
    .filter((entry) => entry.habitatFitItemIds.length > 0 || group.length === 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.stronglySupportedPokemonIds.length - left.stronglySupportedPokemonIds.length ||
        right.averagePokemonCoverageRatio - left.averagePokemonCoverageRatio ||
        right.matchedFavoriteCategoryIds.length - left.matchedFavoriteCategoryIds.length ||
        (habitatById.get(left.habitatId)?.name ?? left.habitatId).localeCompare(
          habitatById.get(right.habitatId)?.name ?? right.habitatId,
        ),
    );

export const getTeamStyleSummary = (group: Pokemon[]): TeamStyleSummary => {
  const recommendedCategories = getRecommendedCategories(group);
  const conflictCount = getHabitatConflicts(group).length;
  if (recommendedCategories[0] && recommendedCategories[0].matchedPokemonIds.length === group.length) {
    return {
      label: "Highly aligned",
      description: "This group converges on at least one favorite category across the full team, so item overlap should be easy to support.",
    };
  }
  if (conflictCount > 0) {
    return {
      label: "Mixed habitats",
      description: "The team has opposite ideal habitat traits, so placement planning will matter more than favorite overlap alone.",
    };
  }
  return {
    label: "Flexible core",
    description: "No severe habitat friction showed up, so this team has room to lean on shared favorites and targeted items.",
  };
};

export const getPokemonName = (pokemonId: string) => pokemonById.get(pokemonId)?.name ?? pokemonId;
export const getHabitatName = (habitatId: string) => habitatById.get(habitatId)?.name ?? habitatId;
export const getSpecialtyLabel = (specialtyId: string) => specialtyById.get(specialtyId)?.name ?? specialtyId;

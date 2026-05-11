import type {
  CategoryCoverageState,
  CurrentHomeState,
  EntityStore,
  HomeBuilderHabitat,
  HomeBuilderItem,
  HomeBuilderPokemon,
  HomeCategoryShareType,
  HomeCategoryStrength,
  RankedHabitat,
  RankedItem,
  RankedPokemon,
  SavedHome,
  SuggestionCardModel,
} from "./models";

const unique = <T>(entries: T[]): T[] => [...new Set(entries)];

const shareWeightByType: Record<HomeCategoryShareType, number> = {
  all: 100,
  most: 70,
  some: 35,
  single: 10,
};
const FAVORITE_MATCH_WEIGHT = 1;
const ACTIVE_HABITAT_MATCH_WEIGHT = 1;
const CORE_OVERLAP_WEIGHT = 3;
const MULTI_OVERLAP_WEIGHT = 2;
const SINGLE_OVERLAP_WEIGHT = 1;
const TOP_OVERLAP_BONUS_WEIGHT = 1;
const TOP_OVERLAP_BONUS_CAP = 2;

const deriveShareType = (count: number, totalPokemon: number): HomeCategoryShareType => {
  if (count === totalPokemon) return "all";
  if (count >= Math.ceil(totalPokemon * 0.6)) return "most";
  if (count >= 2) return "some";
  return "single";
};

export const makeEmptyCurrentHome = (): CurrentHomeState => ({
  id: null,
  name: "My Home",
  pokemonIds: [],
  itemIds: [],
  itemQuantities: {},
  materialProgress: {},
  habitatId: null,
  isDirty: false,
  lastSavedAt: null,
});

export const makeSavedHomesState = (savedHomes: SavedHome[] = []) => ({
  byId: savedHomes.reduce<Record<string, SavedHome>>((accumulator, home) => {
    accumulator[home.id] = home;
    return accumulator;
  }, {}),
  allIds: savedHomes.map((home) => home.id),
});

export const selectResolvedPokemon = (home: CurrentHomeState, entities: EntityStore): HomeBuilderPokemon[] =>
  home.pokemonIds.map((pokemonId) => entities.pokemonById[pokemonId]).filter(Boolean);

export const selectResolvedItems = (home: CurrentHomeState, entities: EntityStore): HomeBuilderItem[] =>
  home.itemIds.map((itemId) => entities.itemsById[itemId]).filter(Boolean);

export const selectResolvedHabitat = (home: CurrentHomeState, entities: EntityStore): HomeBuilderHabitat | null =>
  home.habitatId ? entities.habitatsById[home.habitatId] ?? null : null;

export const selectHomeCategoryStrengths = (
  home: CurrentHomeState,
  entities: EntityStore,
): Record<string, HomeCategoryStrength> => {
  const selectedPokemon = selectResolvedPokemon(home, entities);
  if (selectedPokemon.length === 0) return {};

  const counts = selectedPokemon.reduce<Record<string, number>>((accumulator, pokemon) => {
    unique(pokemon.favoriteCategoryIds).forEach((categoryId) => {
      accumulator[categoryId] = (accumulator[categoryId] ?? 0) + 1;
    });
    return accumulator;
  }, {});

  return Object.entries(counts).reduce<Record<string, HomeCategoryStrength>>((accumulator, [categoryId, count]) => {
    accumulator[categoryId] = {
      categoryId,
      count,
      totalPokemon: selectedPokemon.length,
      shareType: deriveShareType(count, selectedPokemon.length),
    };
    return accumulator;
  }, {});
};

export const selectHomeCategoryCoverage = (
  home: CurrentHomeState,
  entities: EntityStore,
): Record<string, CategoryCoverageState> => {
  const strengths = selectHomeCategoryStrengths(home, entities);
  const selectedItems = selectResolvedItems(home, entities).filter((item) => item.isComfortRelevant);

  return Object.values(strengths).reduce<Record<string, CategoryCoverageState>>((accumulator, strength) => {
    const supplyCount = selectedItems.filter((item) => item.comfortCategoryIds.includes(strength.categoryId)).length;
    const demandCount = strength.count;

    let state: CategoryCoverageState["state"] = "covered";
    if (supplyCount === 0) {
      state = "missing";
    } else if (supplyCount < demandCount) {
      state = "partial";
    } else if (supplyCount > demandCount * 1.5) {
      state = "overcovered";
    }

    accumulator[strength.categoryId] = {
      categoryId: strength.categoryId,
      demandCount,
      supplyCount,
      state,
    };

    return accumulator;
  }, {});
};

export const rankItemForHomeContext = (
  item: HomeBuilderItem,
  categoryStrengthById: Record<string, HomeCategoryStrength>,
  coverageByCategoryId: Record<string, CategoryCoverageState>,
): RankedItem => {
  if (!item.isComfortRelevant) {
    return {
      item,
      score: 0,
      bucket: "neutral",
      matchedCategoryIds: [],
      matchedShareTypes: [],
      fillsMissingCategoryIds: [],
      fillsPartialCategoryIds: [],
    };
  }

  let score = 0;
  const matchedCategoryIds: string[] = [];
  const matchedShareTypes: HomeCategoryShareType[] = [];
  const fillsMissingCategoryIds: string[] = [];
  const fillsPartialCategoryIds: string[] = [];

  item.comfortCategoryIds.forEach((categoryId) => {
    const strength = categoryStrengthById[categoryId];
    if (!strength) return;

    matchedCategoryIds.push(categoryId);
    matchedShareTypes.push(strength.shareType);
    score += shareWeightByType[strength.shareType];

    const coverage = coverageByCategoryId[categoryId];
    if (coverage?.state === "missing") {
      score += 25;
      fillsMissingCategoryIds.push(categoryId);
    } else if (coverage?.state === "partial") {
      score += 10;
      fillsPartialCategoryIds.push(categoryId);
    } else if (coverage?.state === "overcovered") {
      score -= 5;
    }
  });

  if (matchedCategoryIds.length > 1) {
    score += (matchedCategoryIds.length - 1) * 15;
  }

  let bucket: RankedItem["bucket"] = "neutral";
  if (score >= 100 || matchedShareTypes.includes("all") || matchedShareTypes.includes("most")) {
    bucket = "best_match";
  } else if (score > 0) {
    bucket = "supporting_match";
  }

  return {
    item,
    score,
    bucket,
    matchedCategoryIds,
    matchedShareTypes,
    fillsMissingCategoryIds,
    fillsPartialCategoryIds,
  };
};

export const selectRankedItemsForCurrentHome = (
  home: CurrentHomeState,
  entities: EntityStore,
): RankedItem[] => {
  const strengths = selectHomeCategoryStrengths(home, entities);
  const coverage = selectHomeCategoryCoverage(home, entities);

  return entities.allItemIds
    .map((itemId) => rankItemForHomeContext(entities.itemsById[itemId], strengths, coverage))
    .sort((left, right) => right.score - left.score || left.item.name.localeCompare(right.item.name));
};

export const selectRankedPokemonForCurrentHome = (
  home: CurrentHomeState,
  entities: EntityStore,
): RankedPokemon[] => {
  const selectedPokemon = selectResolvedPokemon(home, entities);
  const selectedPokemonIds = new Set(home.pokemonIds);
  const favoriteCountsByCategoryId = selectedPokemon.reduce<Map<string, number>>((accumulator, pokemon) => {
    unique(pokemon.favoriteCategoryIds).forEach((categoryId) => {
      accumulator.set(categoryId, (accumulator.get(categoryId) ?? 0) + 1);
    });
    return accumulator;
  }, new Map<string, number>());
  const preferredHabitatCounts = selectedPokemon.reduce<Map<string, number>>((accumulator, pokemon) => {
    if (!pokemon.idealHabitatId) return accumulator;
    accumulator.set(pokemon.idealHabitatId, (accumulator.get(pokemon.idealHabitatId) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());
  const majorityPreferredHabitatId =
    [...preferredHabitatCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  const strongestOverlapCount = [...favoriteCountsByCategoryId.values()].reduce(
    (max, count) => Math.max(max, count),
    0,
  );
  const strongestOverlapIds = new Set(
    [...favoriteCountsByCategoryId.entries()]
      .filter(([, count]) => count === strongestOverlapCount && strongestOverlapCount > 0)
      .map(([categoryId]) => categoryId),
  );

  const ranked = entities.allPokemonIds
    .filter((pokemonId) => !selectedPokemonIds.has(pokemonId))
    .map((pokemonId) => {
      const candidate = entities.pokemonById[pokemonId];
      const candidateFavoriteIds = unique(candidate.favoriteCategoryIds);
      const sharedFavorites = candidateFavoriteIds.filter(
        (categoryId) => favoriteCountsByCategoryId.has(categoryId),
      );
      const coreMatches = sharedFavorites.filter(
        (categoryId) => selectedPokemon.length > 0 && (favoriteCountsByCategoryId.get(categoryId) ?? 0) === selectedPokemon.length,
      );
      const multiMatches = sharedFavorites.filter(
        (categoryId) => (favoriteCountsByCategoryId.get(categoryId) ?? 0) >= 2,
      );
      const favoriteOverlapScore = sharedFavorites.reduce((sum, categoryId) => {
        const sharedCount = favoriteCountsByCategoryId.get(categoryId) ?? 0;
        if (selectedPokemon.length > 0 && sharedCount === selectedPokemon.length) return sum + CORE_OVERLAP_WEIGHT;
        if (sharedCount >= 2) return sum + MULTI_OVERLAP_WEIGHT;
        if (sharedCount === 1) return sum + SINGLE_OVERLAP_WEIGHT;
        return sum;
      }, 0);
      const strongestOverlapBonus = Math.min(
        sharedFavorites.filter((categoryId) => strongestOverlapIds.has(categoryId)).length * TOP_OVERLAP_BONUS_WEIGHT,
        TOP_OVERLAP_BONUS_CAP,
      );
      const habitatMatches = home.habitatId && candidate.habitatIds.includes(home.habitatId) ? [home.habitatId] : [];
      const preferredHabitatMatchCount = candidate.idealHabitatId
        ? (preferredHabitatCounts.get(candidate.idealHabitatId) ?? 0)
        : 0;
      const preferredHabitatMatchId = preferredHabitatMatchCount > 0 ? candidate.idealHabitatId : null;
      const habitatMajorityAdjustment =
        selectedPokemon.length > 0 && majorityPreferredHabitatId && candidate.idealHabitatId
          ? candidate.idealHabitatId === majorityPreferredHabitatId
            ? 1
            : -1
          : 0;

      const score =
        (favoriteOverlapScore + strongestOverlapBonus) * FAVORITE_MATCH_WEIGHT +
        habitatMatches.length * ACTIVE_HABITAT_MATCH_WEIGHT +
        habitatMajorityAdjustment;

      return {
        pokemon: candidate,
        score,
        section: "none",
        bucket: "neutral",
        matchedCategoryIds: sharedFavorites,
        sharedFavorites,
        coreMatches,
        multiMatches,
        habitatMatches,
        preferredHabitatMatchId,
        preferredHabitatMatchCount,
      };
    });

  const withSections = ranked.map((entry) => {
    const strongestSharedRatio =
      selectedPokemon.length > 0
        ? entry.sharedFavorites.reduce((max, categoryId) => {
            const count = favoriteCountsByCategoryId.get(categoryId) ?? 0;
            const ratio = count / selectedPokemon.length;
            return Math.max(max, ratio);
          }, 0)
        : 0;
    const section: RankedPokemon["section"] =
      entry.sharedFavorites.length === 0 || entry.score <= 0
        ? "none"
        : strongestSharedRatio >= 0.9
          ? "strong"
          : strongestSharedRatio >= 0.6
            ? "good"
            : "some";
    const bucket: RankedPokemon["bucket"] =
      section === "strong" ? "best_match" : section === "none" ? "neutral" : "supporting_match";
    return {
      ...entry,
      section,
      bucket,
    };
  });

  return withSections.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.multiMatches.length !== left.multiMatches.length) {
      return right.multiMatches.length - left.multiMatches.length;
    }
    if (right.sharedFavorites.length !== left.sharedFavorites.length) {
      return right.sharedFavorites.length - left.sharedFavorites.length;
    }
    if (right.preferredHabitatMatchCount !== left.preferredHabitatMatchCount) {
      return right.preferredHabitatMatchCount - left.preferredHabitatMatchCount;
    }
    return left.pokemon.name.localeCompare(right.pokemon.name);
  });
};

export const selectRankedHabitatsForCurrentHome = (
  home: CurrentHomeState,
  entities: EntityStore,
): RankedHabitat[] => {
  const selectedPokemon = selectResolvedPokemon(home, entities);
  const strengths = selectHomeCategoryStrengths(home, entities);

  return entities.allHabitatIds
    .map((habitatId) => {
      const habitat = entities.habitatsById[habitatId];
      const matchedPokemonCount = selectedPokemon.filter((pokemon) => pokemon.habitatIds.includes(habitat.id)).length;
      const matchedCategoryIds = habitat.relatedComfortCategoryIds.filter((categoryId) => Boolean(strengths[categoryId]));
      const score = matchedPokemonCount * 45 + matchedCategoryIds.reduce((sum, categoryId) => sum + shareWeightByType[strengths[categoryId].shareType], 0);

      const bucket: RankedHabitat["bucket"] =
        score >= 120 ? "best_match" : score > 0 ? "supporting_match" : "neutral";

      return {
        habitat,
        score,
        bucket,
        matchedPokemonCount,
        matchedCategoryIds,
      };
    })
    .sort((left, right) => right.score - left.score || left.habitat.name.localeCompare(right.habitat.name));
};

const priorityOrder: Record<SuggestionCardModel["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const labelForCategory = (categoryId: string) =>
  categoryId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const selectSuggestionsForCurrentHome = (
  home: CurrentHomeState,
  entities: EntityStore,
): SuggestionCardModel[] => {
  const suggestions: SuggestionCardModel[] = [];
  const coverageByCategoryId = selectHomeCategoryCoverage(home, entities);
  const strengths = selectHomeCategoryStrengths(home, entities);
  const rankedHabitats = selectRankedHabitatsForCurrentHome(home, entities);

  if (home.habitatId) {
    const selectedPokemon = selectResolvedPokemon(home, entities);
    const mismatches = selectedPokemon.filter((pokemon) => !pokemon.habitatIds.includes(home.habitatId!));
    if (mismatches.length > 0) {
      suggestions.push({
        id: `habitat-conflict-${home.habitatId}`,
        kind: "habitat_conflict",
        priority: "critical",
        label: "Habitat mismatch",
        headline: `${mismatches.length} Pokemon may be uncomfortable in this habitat`,
        body: "Try a habitat that overlaps more of your selected Pokemon, or keep it if you want to optimize around items instead.",
        action: rankedHabitats[0]
          ? {
              label: `Try ${rankedHabitats[0].habitat.name}`,
              payload: { type: "set_habitat", habitatId: rankedHabitats[0].habitat.id },
            }
          : undefined,
      });
    }
  }

  Object.values(coverageByCategoryId).forEach((coverage) => {
    const strength = strengths[coverage.categoryId];
    if (!strength) return;

    if (coverage.state === "missing" && (strength.shareType === "all" || strength.shareType === "most")) {
      suggestions.push({
        id: `missing-${coverage.categoryId}`,
        kind: "missing_category",
        priority: "high",
        label: "Missing category",
        headline: `Add support for ${labelForCategory(coverage.categoryId)}`,
        body: "This is a strong direction in your selected Pokemon, but your current items do not support it yet.",
        action: { label: "Browse supporting items", payload: { type: "open_items", categoryId: coverage.categoryId } },
        previewChips: [{ type: "category", id: coverage.categoryId, label: labelForCategory(coverage.categoryId) }],
      });
    }

    if (coverage.state === "partial") {
      suggestions.push({
        id: `partial-${coverage.categoryId}`,
        kind: "partial_category",
        priority: "medium",
        label: "Partial coverage",
        headline: `${labelForCategory(coverage.categoryId)} could use more support`,
        body: "You have some support in place, but adding one more matching item would make this category more consistent.",
        action: { label: "Find matching items", payload: { type: "open_items", categoryId: coverage.categoryId } },
      });
    }
  });

  const dominant = Object.values(strengths)
    .filter((strength) => strength.shareType === "all" || strength.shareType === "most")
    .sort((left, right) => right.count - left.count)[0];

  if (dominant) {
    suggestions.push({
      id: `theme-${dominant.categoryId}`,
      kind: "theme_direction",
      priority: "low",
      label: "Theme direction",
      headline: `Your home is leaning into ${labelForCategory(dominant.categoryId)}`,
      body: "Use this as a guiding theme, or ignore it and keep exploring broadly.",
      action: {
        label: "Browse Pokemon in this direction",
        payload: { type: "open_pokemon", filters: { categoryIds: [dominant.categoryId] } },
      },
    });
  }

  return suggestions.sort((left, right) => {
    const byPriority = priorityOrder[left.priority] - priorityOrder[right.priority];
    return byPriority || left.headline.localeCompare(right.headline);
  });
};

export const groupItemsBySections = (rankedItems: RankedItem[]) => ({
  best: rankedItems.filter((entry) => entry.bucket === "best_match"),
  supporting: rankedItems.filter((entry) => entry.bucket === "supporting_match"),
  neutral: rankedItems.filter((entry) => entry.bucket === "neutral"),
});

export const groupPokemonBySections = (rankedPokemon: RankedPokemon[]) => ({
  best: rankedPokemon.filter((entry) => entry.bucket === "best_match"),
  supporting: rankedPokemon.filter((entry) => entry.bucket === "supporting_match"),
  neutral: rankedPokemon.filter((entry) => entry.bucket === "neutral"),
});

export const groupHabitatsBySections = (rankedHabitats: RankedHabitat[]) => ({
  best: rankedHabitats.filter((entry) => entry.bucket === "best_match"),
  supporting: rankedHabitats.filter((entry) => entry.bucket === "supporting_match"),
  neutral: rankedHabitats.filter((entry) => entry.bucket === "neutral"),
});

const normalizeItemQuantities = (itemIds: string[], itemQuantities: Record<string, number> | null | undefined) => {
  const normalized: Record<string, number> = {};
  itemIds.forEach((itemId) => {
    const raw = itemQuantities?.[itemId];
    normalized[itemId] = Number.isFinite(raw) && (raw as number) > 0 ? Math.floor(raw as number) : 1;
  });
  return normalized;
};

const normalizeMaterialProgress = (
  materialProgress: Record<string, { ownedQuantity: number }> | null | undefined,
): Record<string, { ownedQuantity: number }> => {
  if (!materialProgress) return {};
  return Object.entries(materialProgress).reduce<Record<string, { ownedQuantity: number }>>((accumulator, [materialId, value]) => {
    const ownedQuantity = Number.isFinite(value?.ownedQuantity) ? Math.max(0, Math.floor(value.ownedQuantity)) : 0;
    accumulator[materialId] = { ownedQuantity };
    return accumulator;
  }, {});
};

export const normalizeCurrentHomeState = (home: CurrentHomeState | null | undefined): CurrentHomeState => {
  if (!home) return makeEmptyCurrentHome();

  return {
    ...home,
    itemQuantities: normalizeItemQuantities(home.itemIds ?? [], home.itemQuantities),
    materialProgress: normalizeMaterialProgress(home.materialProgress),
  };
};

export const normalizeSavedHome = (home: SavedHome): SavedHome => ({
  ...home,
  itemQuantities: normalizeItemQuantities(home.itemIds ?? [], home.itemQuantities),
  materialProgress: normalizeMaterialProgress(home.materialProgress),
});

export const normalizeSavedHomes = (savedHomes: SavedHome[] = []) => savedHomes.map(normalizeSavedHome);

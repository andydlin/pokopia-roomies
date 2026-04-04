import { favoriteCategories, favoriteCategoryById } from "../../data/favoriteCategories";
import { habitatTraitById, habitatTraits } from "../../data/habitatTraits";
import { itemById, items } from "../../data/items";
import { pokemon } from "../../data/pokemon";
import type {
  FavoriteCategory,
  Item,
  ItemRecommendation,
  LookupFilters,
  LookupMatch,
  PairHabitatConflict,
  Pokemon,
  RecommendedCategory,
  TeamConflict,
} from "../types";
import { intersection, unique } from "../utils/array";
import {
  getFavoriteCategoryName,
  getHabitatTraitLabel,
  getItemName,
  getSpecialtyName,
} from "../utils/labels";
import { SCORE_WEIGHTS } from "../scoring/constants";

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
        score,
        reasons: [
          `Matches ${matchedPokemonIds.length}/${group.length} selected Pokemon.`,
          item.craftable ? "Craftable item." : "Not craftable in the seed data.",
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

      if (filters.query && !entry.name.toLowerCase().includes(filters.query.toLowerCase())) {
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

      if (filters.habitatTraitId !== "all") {
        if (!entry.idealHabitatTraitIds.includes(filters.habitatTraitId)) {
          return null;
        }
        reasons.push(`Prefers ${getHabitatTraitLabel(filters.habitatTraitId)}`);
      }

      if (filters.specialtyId !== "all") {
        if (entry.specialtyId !== filters.specialtyId) {
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

export const getTeamStyleSummary = (group: Pokemon[]) => {
  const recommendedCategories = getRecommendedCategories(group);
  const conflictCount = getHabitatConflicts(group).length;
  if (recommendedCategories[0] && recommendedCategories[0].matchedPokemonIds.length === group.length) {
    return {
      label: "More item-efficient",
      description: "This team shares at least one category across everyone, so a smaller item pool goes further.",
    };
  }
  if (conflictCount === 0) {
    return {
      label: "More flexible",
      description: "This team avoids direct habitat conflicts and leaves more room to decorate around preferences.",
    };
  }
  return {
    label: "More specialized",
    description: "This team can work, but it asks for more careful habitat and item planning.",
  };
};

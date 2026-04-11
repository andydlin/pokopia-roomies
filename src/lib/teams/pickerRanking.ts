import type { Pokemon } from "../types";
import { intersection } from "../utils/array";

export type PickerSectionId = "best" | "good" | "challenging";

export interface RankedPickerCandidate {
  entry: Pokemon;
  score: number;
  sectionId: PickerSectionId | null;
  sharedFavoriteCategoryIds: string[];
  sharedHabitatIds: string[];
  selectedOverlapCount: number;
}

const compareByDexThenName = (left: Pokemon, right: Pokemon) => {
  const leftDex = left.dexNumber ?? Number.POSITIVE_INFINITY;
  const rightDex = right.dexNumber ?? Number.POSITIVE_INFINITY;
  return leftDex - rightDex || left.fullDisplayName.localeCompare(right.fullDisplayName);
};

const sortByCandidateRank = (left: RankedPickerCandidate, right: RankedPickerCandidate) =>
  right.score - left.score ||
  right.sharedFavoriteCategoryIds.length - left.sharedFavoriteCategoryIds.length ||
  compareByDexThenName(left.entry, right.entry);

export const rankPokemonPickerCandidates = ({
  selected,
  available,
  query,
}: {
  selected: Pokemon[];
  available: Pokemon[];
  query: string;
}): RankedPickerCandidate[] => {
  const normalizedQuery = query.trim().toLowerCase();
  const selectedFavoriteFrequency = new Map<string, number>();
  const selectedHabitatIds = new Set(selected.flatMap((entry) => entry.habitatIds));

  selected.forEach((entry) => {
    const uniqueFavoritesForPokemon = new Set(entry.favoriteCategoryIds);
    uniqueFavoritesForPokemon.forEach((favoriteCategoryId) => {
      selectedFavoriteFrequency.set(
        favoriteCategoryId,
        (selectedFavoriteFrequency.get(favoriteCategoryId) ?? 0) + 1,
      );
    });
  });

  const filtered = available.filter((entry) => {
    if (normalizedQuery.length === 0) return true;
    return [entry.name, entry.fullDisplayName, entry.slug, String(entry.dexNumber ?? "")]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  if (selected.length === 0) {
    return filtered
      .map((entry) => ({
        entry,
        score: 0,
        sectionId: null,
        sharedFavoriteCategoryIds: [],
        sharedHabitatIds: [],
        selectedOverlapCount: 0,
      }))
      .sort((left, right) => compareByDexThenName(left.entry, right.entry));
  }

  return filtered
    .map((entry) => {
      const sharedFavoriteCategoryIds = entry.favoriteCategoryIds.filter((categoryId) =>
        selectedFavoriteFrequency.has(categoryId),
      );
      const selectedOverlapCount = selected.reduce((count, selectedEntry) => {
        const overlapCount = intersection(entry.favoriteCategoryIds, selectedEntry.favoriteCategoryIds).length;
        return count + (overlapCount > 0 ? 1 : 0);
      }, 0);
      const pairwiseFavoriteOverlap = selected.reduce(
        (sum, selectedEntry) => sum + intersection(entry.favoriteCategoryIds, selectedEntry.favoriteCategoryIds).length,
        0,
      );
      const weightedSharedFavoriteScore = sharedFavoriteCategoryIds.reduce(
        (sum, categoryId) => sum + (selectedFavoriteFrequency.get(categoryId) ?? 0),
        0,
      );
      const sharedHabitatIds = entry.habitatIds.filter((habitatId) => selectedHabitatIds.has(habitatId));
      const score =
        weightedSharedFavoriteScore * 100 +
        selectedOverlapCount * 35 +
        pairwiseFavoriteOverlap * 12 +
        sharedHabitatIds.length * 2;

      const strongOverlapTarget = Math.min(selected.length, 2);
      const sectionId: PickerSectionId =
        sharedFavoriteCategoryIds.length === 0
          ? "challenging"
          : selectedOverlapCount >= strongOverlapTarget &&
              (sharedFavoriteCategoryIds.length >= 2 || weightedSharedFavoriteScore >= strongOverlapTarget + 1)
            ? "best"
            : "good";

      return {
        entry,
        score,
        sectionId,
        sharedFavoriteCategoryIds,
        sharedHabitatIds,
        selectedOverlapCount,
      };
    })
    .sort(sortByCandidateRank);
};

export const groupPokemonPickerCandidates = (rankedCandidates: RankedPickerCandidate[]) => [
  {
    id: "best" as const,
    title: "Best fits",
    items: rankedCandidates.filter((entry) => entry.sectionId === "best"),
  },
  {
    id: "good" as const,
    title: "Works well",
    items: rankedCandidates.filter((entry) => entry.sectionId === "good"),
  },
  {
    id: "challenging" as const,
    title: "More difficult fits",
    items: rankedCandidates.filter((entry) => entry.sectionId === "challenging"),
  },
];

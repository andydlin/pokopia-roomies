import type { BuilderBrowseState, CurrentHomeState, EntityStore, SavedHomesState } from "./models";
import { getBuildMaterialProgressEntries, getBuildProgressSummary } from "./materialPlanning";
import {
  groupHabitatsBySections,
  groupItemsBySections,
  groupPokemonBySections,
  selectHomeCategoryCoverage,
  selectHomeCategoryStrengths,
  selectRankedHabitatsForCurrentHome,
  selectRankedItemsForCurrentHome,
  selectRankedPokemonForCurrentHome,
  selectResolvedHabitat,
  selectResolvedItems,
  selectResolvedPokemon,
  selectSuggestionsForCurrentHome,
} from "./logic";

const includesQuery = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase());
const toTitle = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const selectCurrentHome = (currentHome: CurrentHomeState) => currentHome;

export const selectSavedHomes = (savedHomes: SavedHomesState) =>
  savedHomes.allIds.map((homeId) => savedHomes.byId[homeId]).filter(Boolean);

export const selectResolvedHomeEntities = (currentHome: CurrentHomeState, entities: EntityStore) => ({
  pokemon: selectResolvedPokemon(currentHome, entities),
  items: selectResolvedItems(currentHome, entities),
  habitat: selectResolvedHabitat(currentHome, entities),
});

export const selectHomeSummary = (currentHome: CurrentHomeState, entities: EntityStore) => {
  const resolved = selectResolvedHomeEntities(currentHome, entities);
  const strengths = Object.values(selectHomeCategoryStrengths(currentHome, entities));
  const dominantCategories = strengths
    .filter((entry) => entry.shareType === "all" || entry.shareType === "most")
    .sort((left, right) => right.count - left.count)
    .map((entry) => entry.categoryId);

  return {
    pokemonCount: resolved.pokemon.length,
    itemCount: resolved.items.length,
    hasHabitat: Boolean(resolved.habitat),
    dominantCategories,
  };
};

export const selectItemBrowserSections = (
  currentHome: CurrentHomeState,
  browseState: BuilderBrowseState,
  entities: EntityStore,
) => {
  const filtered = selectFilteredRankedItems(currentHome, browseState, entities);
  return groupItemsBySections(filtered);
};

export const selectFilteredRankedItems = (
  currentHome: CurrentHomeState,
  browseState: BuilderBrowseState,
  entities: EntityStore,
) => {
  const rankedItems = selectRankedItemsForCurrentHome(currentHome, entities);
  const mode = browseState.items.browseMode;
  const query = browseState.items.searchQuery;
  const filterRankedItems = ({
    ignoreIntent = false,
  }: {
    ignoreIntent?: boolean;
  } = {}) =>
    rankedItems.filter((entry) => {
      if (browseState.items.generalCategoryId) {
        const selectedCategory = browseState.items.generalCategoryId;
        if (entry.item.generalCategoryId !== selectedCategory && entry.item.generalCategoryLabel !== selectedCategory) {
          return false;
        }
      }

      if (browseState.items.comfortCategoryId && !entry.item.comfortCategoryIds.includes(browseState.items.comfortCategoryId)) {
        return false;
      }

      if (browseState.items.favoriteCategoryId && !entry.item.favoriteCategoryIds.includes(browseState.items.favoriteCategoryId)) {
        return false;
      }

      if (query && !includesQuery([entry.item.name, entry.item.generalCategoryLabel].join(" "), query)) {
        return false;
      }

      if (!ignoreIntent && browseState.items.intent === "missing_categories") {
        return entry.fillsMissingCategoryIds.length > 0;
      }

      if (!ignoreIntent && browseState.items.intent === "best_fit") {
        return entry.bucket === "best_match" || entry.bucket === "supporting_match";
      }

      return true;
    });
  const filtered = filterRankedItems();

  if (filtered.length > 0) {
    if (mode === "all") {
      return [...filtered].sort(
        (left, right) =>
          left.item.generalCategoryLabel.localeCompare(right.item.generalCategoryLabel) ||
          left.item.name.localeCompare(right.item.name),
      );
    }
    return filtered;
  }

  // Never hard-block browsing: if contextual intent is too strict, relax intent.
  // Keep explicit user filters (category, comfort tag, favorite tag, query) intact.
  const fallback = filterRankedItems({ ignoreIntent: true });
  if (mode === "all") {
    return [...fallback].sort(
      (left, right) =>
        left.item.generalCategoryLabel.localeCompare(right.item.generalCategoryLabel) ||
        left.item.name.localeCompare(right.item.name),
    );
  }
  return fallback;
};

export const selectComfortItems = (
  currentHome: CurrentHomeState,
  browseState: BuilderBrowseState,
  entities: EntityStore,
) => selectFilteredRankedItems(currentHome, browseState, entities).filter((entry) => entry.item.comfortCategoryIds.length > 0);

export const selectNonComfortItemsExcludingMaterials = (
  currentHome: CurrentHomeState,
  browseState: BuilderBrowseState,
  entities: EntityStore,
) =>
  selectFilteredRankedItems(currentHome, browseState, entities).filter(
    (entry) =>
      entry.item.comfortCategoryIds.length === 0 &&
      entry.item.favoriteCategoryIds.length === 0 &&
      entry.item.generalCategoryLabel !== "Materials" &&
      entry.item.generalCategoryLabel !== "Key Items",
  );

export const selectBuildMaterialsSummary = (currentHome: CurrentHomeState, entities: EntityStore) => ({
  progress: getBuildProgressSummary(currentHome, entities),
  entries: getBuildMaterialProgressEntries(currentHome, entities),
});

export const selectPokemonBrowserSections = (
  currentHome: CurrentHomeState,
  browseState: BuilderBrowseState,
  entities: EntityStore,
) => {
  const rankedPokemon = selectRankedPokemonForCurrentHome(currentHome, entities);

  const filtered = rankedPokemon.filter((entry) => {
    if (browseState.pokemon.searchQuery && !includesQuery(entry.pokemon.name, browseState.pokemon.searchQuery)) {
      return false;
    }

    if (browseState.pokemon.typeId && !entry.pokemon.typeIds.includes(browseState.pokemon.typeId)) {
      return false;
    }

    if (browseState.pokemon.favoriteCategoryId && !entry.pokemon.favoriteCategoryIds.includes(browseState.pokemon.favoriteCategoryId)) {
      return false;
    }

    if (browseState.pokemon.habitatId && !entry.pokemon.habitatIds.includes(browseState.pokemon.habitatId)) {
      return false;
    }

    return true;
  });

  if (browseState.pokemon.searchQuery) {
    const q = browseState.pokemon.searchQuery.trim().toLowerCase();
    filtered.sort((a, b) => {
      const aStarts = a.pokemon.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.pokemon.name.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    });
  }

  return groupPokemonBySections(filtered);
};

export const selectHabitatBrowserSections = (
  currentHome: CurrentHomeState,
  browseState: BuilderBrowseState,
  entities: EntityStore,
) => {
  const rankedHabitats = selectRankedHabitatsForCurrentHome(currentHome, entities);
  const filtered = rankedHabitats.filter((entry) => {
    if (browseState.habitats.searchQuery && !includesQuery(entry.habitat.name, browseState.habitats.searchQuery)) {
      return false;
    }
    return true;
  });

  return groupHabitatsBySections(filtered);
};

export const selectSuggestions = (currentHome: CurrentHomeState, entities: EntityStore) =>
  selectSuggestionsForCurrentHome(currentHome, entities);

export const selectHomeCategoryCoverageSummary = (currentHome: CurrentHomeState, entities: EntityStore) =>
  Object.values(selectHomeCategoryCoverage(currentHome, entities));

export const selectItemComfortCategoryOptions = (entities: EntityStore) => {
  const labelsById = new Map<string, string>();

  entities.allItemIds.forEach((itemId) => {
    const item = entities.itemsById[itemId];
    item.comfortCategoryIds.forEach((categoryId, index) => {
      if (!labelsById.has(categoryId)) {
        labelsById.set(categoryId, item.comfortCategoryLabels[index] ?? toTitle(categoryId));
      }
    });
  });

  return [...labelsById.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

export const selectItemFavoriteCategoryOptions = (entities: EntityStore) => {
  const labelsById = new Map<string, string>();

  entities.allItemIds.forEach((itemId) => {
    const item = entities.itemsById[itemId];
    item.favoriteCategoryIds.forEach((categoryId) => {
      if (!labelsById.has(categoryId)) {
        labelsById.set(categoryId, toTitle(categoryId));
      }
    });
  });

  return [...labelsById.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

export const selectItemMainCategoryOptions = (entities: EntityStore) => {
  const labels = new Set<string>();

  entities.allItemIds.forEach((itemId) => {
    labels.add(entities.itemsById[itemId].generalCategoryLabel || "Other");
  });

  return [...labels].sort((left, right) => left.localeCompare(right));
};

export const selectPokemonTypeOptions = (entities: EntityStore) => {
  const typeIds = new Set<string>();

  entities.allPokemonIds.forEach((pokemonId) => {
    entities.pokemonById[pokemonId].typeIds.forEach((typeId) => typeIds.add(typeId));
  });

  return [...typeIds].sort((left, right) => left.localeCompare(right));
};

export const selectFavoriteItemSections = (
  currentHome: CurrentHomeState,
  browseState: BuilderBrowseState,
  entities: EntityStore,
) => {
  const rankedItems = selectFilteredRankedItems(currentHome, browseState, entities);
  const query = browseState.favorites.searchQuery.trim().toLowerCase();
  const selectedFavoriteCategoryId = browseState.favorites.favoriteCategoryId;

  const entries = rankedItems.filter((entry) => {
    if (entry.item.favoriteCategoryIds.length === 0) return false;
    if (selectedFavoriteCategoryId && !entry.item.favoriteCategoryIds.includes(selectedFavoriteCategoryId)) {
      return false;
    }

    if (!query) return true;
    const favoriteLabels = entry.item.favoriteCategoryIds.map((categoryId) => toTitle(categoryId)).join(" ");
    return includesQuery([entry.item.name, entry.item.generalCategoryLabel, favoriteLabels].join(" "), query);
  });

  const grouped = entries.reduce<Record<string, typeof entries>>((accumulator, entry) => {
    entry.item.favoriteCategoryIds.forEach((favoriteCategoryId) => {
      if (selectedFavoriteCategoryId && favoriteCategoryId !== selectedFavoriteCategoryId) return;
      (accumulator[favoriteCategoryId] ??= []).push(entry);
    });
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([favoriteCategoryId, favoriteEntries]) => ({
      favoriteCategoryId,
      items: favoriteEntries.sort((left, right) => left.item.name.localeCompare(right.item.name)),
    }))
    .sort((left, right) => toTitle(left.favoriteCategoryId).localeCompare(toTitle(right.favoriteCategoryId)));
};

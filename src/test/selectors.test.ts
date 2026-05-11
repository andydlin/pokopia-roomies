import { describe, expect, it } from "vitest";
import { entityStore } from "../domain/home-builder/entities";
import { makeEmptyCurrentHome } from "../domain/home-builder/logic";
import {
  selectBuildMaterialsSummary,
  selectComfortItems,
  selectFavoriteItemSections,
  selectHabitatBrowserSections,
  selectFilteredRankedItems,
  selectItemComfortCategoryOptions,
  selectItemFavoriteCategoryOptions,
  selectItemMainCategoryOptions,
  selectNonComfortItemsExcludingMaterials,
  selectItemBrowserSections,
  selectPokemonTypeOptions,
  selectPokemonBrowserSections,
} from "../domain/home-builder/selectors";
import { createInitialHomeBuilderState } from "../features/home-builder/state/homeBuilderReducer";

describe("browser selectors", () => {
  it("returns contextual item sections while keeping neutral items visible", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        pokemonIds: ["pikachu", "eevee"],
      },
    });

    const sections = selectItemBrowserSections(state.currentHome, state.browse, entityStore);

    expect(sections.best.length + sections.supporting.length + sections.neutral.length).toBeGreaterThan(0);
    expect(sections.neutral.length).toBeGreaterThan(0);
  });

  it("keeps pokemon and habitat section selectors active with partial homes", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        itemIds: ["bonfire"],
      },
    });

    const pokemonSections = selectPokemonBrowserSections(state.currentHome, state.browse, entityStore);
    const habitatSections = selectHabitatBrowserSections(state.currentHome, state.browse, entityStore);

    expect(pokemonSections.best.length + pokemonSections.supporting.length + pokemonSections.neutral.length).toBeGreaterThan(0);
    expect(habitatSections.best.length + habitatSections.supporting.length + habitatSections.neutral.length).toBeGreaterThan(0);
  });

  it("falls back to ranked items when strict item guidance filters produce zero rows", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        pokemonIds: ["pikachu", "eevee"],
      },
    });

    state.browse.items.intent = "missing_categories";

    const sections = selectItemBrowserSections(state.currentHome, state.browse, entityStore);
    const total = sections.best.length + sections.supporting.length + sections.neutral.length;

    expect(total).toBeGreaterThan(0);
  });

  it("applies comfort-tag filtering to item sections", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        pokemonIds: ["pikachu", "eevee"],
      },
    });

    const firstTaggedItem = entityStore.allItemIds
      .map((itemId) => entityStore.itemsById[itemId])
      .find((item) => item.comfortCategoryIds.length > 0);

    expect(firstTaggedItem).toBeTruthy();

    const categoryId = firstTaggedItem!.comfortCategoryIds[0];
    state.browse.items.comfortCategoryId = categoryId;
    state.browse.items.intent = null;

    const sections = selectItemBrowserSections(state.currentHome, state.browse, entityStore);
    const visibleItems = [...sections.best, ...sections.supporting, ...sections.neutral];

    expect(visibleItems.length).toBeGreaterThan(0);
    visibleItems.forEach((entry) => {
      expect(entry.item.comfortCategoryIds).toContain(categoryId);
    });
  });

  it("builds comfort-tag options from item comfort tags", () => {
    const options = selectItemComfortCategoryOptions(entityStore);
    expect(options.length).toBeGreaterThan(0);

    options.forEach((option) => {
      const hasMatchingItem = entityStore.allItemIds.some((itemId) =>
        entityStore.itemsById[itemId].comfortCategoryIds.includes(option.id),
      );
      expect(hasMatchingItem).toBe(true);
    });
  });

  it("applies item favorite-category filtering to item sections", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
      },
    });

    const favoriteOptions = selectItemFavoriteCategoryOptions(entityStore);
    expect(favoriteOptions.length).toBeGreaterThan(0);

    const favoriteCategoryId = favoriteOptions[0].id;
    state.browse.items.favoriteCategoryId = favoriteCategoryId;

    const sections = selectItemBrowserSections(state.currentHome, state.browse, entityStore);
    const visibleItems = [...sections.best, ...sections.supporting, ...sections.neutral];

    expect(visibleItems.length).toBeGreaterThan(0);
    visibleItems.forEach((entry) => {
      expect(entry.item.favoriteCategoryIds).toContain(favoriteCategoryId);
    });
  });

  it("groups favorites tab results by favorite section and applies favorites-category filter", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
      },
    });

    const allSections = selectFavoriteItemSections(state.currentHome, state.browse, entityStore);
    expect(allSections.length).toBeGreaterThan(0);
    allSections.forEach((section) => {
      expect(section.items.length).toBeGreaterThan(0);
      section.items.forEach((entry) => {
        expect(entry.item.favoriteCategoryIds).toContain(section.favoriteCategoryId);
      });
    });

    const selectedFavoriteId = allSections[0].favoriteCategoryId;
    state.browse.favorites.favoriteCategoryId = selectedFavoriteId;
    const filteredSections = selectFavoriteItemSections(state.currentHome, state.browse, entityStore);

    expect(filteredSections.length).toBe(1);
    expect(filteredSections[0].favoriteCategoryId).toBe(selectedFavoriteId);
    filteredSections[0].items.forEach((entry) => {
      expect(entry.item.favoriteCategoryIds).toContain(selectedFavoriteId);
    });
  });

  it("applies item main-category filtering to item sections", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
      },
    });

    const categoryOptions = selectItemMainCategoryOptions(entityStore);
    expect(categoryOptions.length).toBeGreaterThan(0);

    const categoryLabel = categoryOptions[0];
    state.browse.items.generalCategoryId = categoryLabel;

    const sections = selectItemBrowserSections(state.currentHome, state.browse, entityStore);
    const visibleItems = [...sections.best, ...sections.supporting, ...sections.neutral];

    expect(visibleItems.length).toBeGreaterThan(0);
    visibleItems.forEach((entry) => {
      expect(entry.item.generalCategoryLabel).toBe(categoryLabel);
    });
  });

  it("applies item intent filtering in both contextual mode and browse all", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        pokemonIds: ["pikachu", "eevee"],
      },
    });

    state.browse.items.intent = null;
    state.browse.items.browseMode = "all";
    const allNoIntent = selectFilteredRankedItems(state.currentHome, state.browse, entityStore);

    state.browse.items.intent = "best_fit";
    state.browse.items.browseMode = "contextual";
    const contextual = selectFilteredRankedItems(state.currentHome, state.browse, entityStore);

    state.browse.items.browseMode = "all";
    const browseAll = selectFilteredRankedItems(state.currentHome, state.browse, entityStore);

    expect(contextual.length).toBeGreaterThan(0);
    expect(browseAll.length).toBeGreaterThan(0);
    expect(browseAll.length).toBeLessThanOrEqual(allNoIntent.length);
    expect(browseAll.length).toBeGreaterThan(0);
  });

  it("applies pokemon type filtering and exposes type options", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        itemIds: ["bonfire"],
      },
    });

    const typeOptions = selectPokemonTypeOptions(entityStore);
    expect(typeOptions.length).toBeGreaterThan(0);

    const selectedType = typeOptions[0];
    state.browse.pokemon.typeId = selectedType;

    const pokemonSections = selectPokemonBrowserSections(state.currentHome, state.browse, entityStore);
    const visiblePokemon = [...pokemonSections.best, ...pokemonSections.supporting, ...pokemonSections.neutral];

    expect(visiblePokemon.length).toBeGreaterThan(0);
    visiblePokemon.forEach((entry) => {
      expect(entry.pokemon.typeIds).toContain(selectedType);
    });
  });

  it("returns only comfort items for comfort-phase selector", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        pokemonIds: ["pikachu", "eevee"],
      },
    });

    const entries = selectComfortItems(state.currentHome, state.browse, entityStore);
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry) => {
      expect(entry.item.comfortCategoryIds.length).toBeGreaterThan(0);
    });
  });

  it("returns only non-comfort non-materials items for extra-items selector", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
      },
    });

    const entries = selectNonComfortItemsExcludingMaterials(state.currentHome, state.browse, entityStore);
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((entry) => {
      expect(entry.item.comfortCategoryIds.length).toBe(0);
      expect(entry.item.favoriteCategoryIds.length).toBe(0);
      expect(entry.item.generalCategoryLabel).not.toBe("Materials");
      expect(entry.item.generalCategoryLabel).not.toBe("Key Items");
    });
  });

  it("build materials summary is based on selected build items", () => {
    const state = createInitialHomeBuilderState({
      currentHome: {
        ...makeEmptyCurrentHome(),
        itemIds: ["bonfire"],
        itemQuantities: { bonfire: 2 },
      },
    });

    const summary = selectBuildMaterialsSummary(state.currentHome, entityStore);
    expect(summary.progress.totalMaterials).toBeGreaterThanOrEqual(0);
    expect(summary.entries).toBeDefined();
  });
});

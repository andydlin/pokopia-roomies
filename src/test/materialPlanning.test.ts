import { describe, expect, it } from "vitest";
import {
  getBuildComparisonStats,
  getBuildMaterialAggregation,
  getBuildProgressSummary,
  getBuildRecipeStatusBreakdown,
  getHighlightedItemIdsForMaterial,
  getMaterialIdsForBuildItem,
  getHoveredItemMaterialIds,
  getMaterialContributors,
} from "../domain/home-builder/materialPlanning";
import { makeEmptyCurrentHome } from "../domain/home-builder/logic";
import type { EntityStore, HomeBuilderItem, SavedHome } from "../domain/home-builder/models";

const item = (overrides: Partial<HomeBuilderItem> & Pick<HomeBuilderItem, "id" | "name">): HomeBuilderItem => {
  const { id, name, ...rest } = overrides;
  return {
    id,
    slug: id,
    name,
    image: null,
    generalCategoryId: "materials",
    generalCategoryLabel: "Materials",
    comfortCategoryIds: [],
    comfortCategoryLabels: [],
    favoriteCategoryIds: [],
    isComfortRelevant: false,
    craftable: true,
    materials: [],
    obtainabilityDetails: [],
    sources: [],
    ...rest,
  };
};

const entities: EntityStore = {
  pokemonById: {},
  itemsById: {
    chair: item({ id: "chair", name: "Chair", craftable: true, materials: [{ itemName: "Wood", quantity: 3 }, { itemName: "Nail", quantity: 1 }] }),
    lamp: item({ id: "lamp", name: "Lamp", craftable: true, materials: [{ itemName: "Wood", quantity: 1 }, { itemName: "Glass", quantity: 2 }] }),
    poster: item({ id: "poster", name: "Poster", craftable: true, materials: [] }),
    plush: item({ id: "plush", name: "Plush", craftable: false, materials: [] }),
    wood: item({ id: "wood", name: "Wood", craftable: false }),
    nail: item({ id: "nail", name: "Nail", craftable: false }),
    glass: item({ id: "glass", name: "Glass", craftable: false }),
  },
  habitatsById: {},
  allPokemonIds: [],
  allItemIds: ["chair", "lamp", "poster", "plush", "wood", "nail", "glass"],
  allHabitatIds: [],
};

describe("material planning selectors", () => {
  it("aggregates materials across item quantities and exposes contributors", () => {
    const home = {
      ...makeEmptyCurrentHome(),
      itemIds: ["chair", "lamp", "poster", "plush"],
      itemQuantities: { chair: 2, lamp: 1, poster: 1, plush: 1 },
    };

    const aggregation = getBuildMaterialAggregation(home, entities);

    expect(aggregation.map((entry) => entry.materialName)).toEqual(["Glass", "Nail", "Wood"]);
    const wood = aggregation.find((entry) => entry.materialId === "wood");
    expect(wood).toBeTruthy();
    expect(wood?.totalNeeded).toBe(7);
    expect(wood?.usedByCount).toBe(2);
    expect(wood?.contributors.map((entry) => `${entry.itemId}:${entry.totalContribution}`)).toEqual([
      "chair:6",
      "lamp:1",
    ]);

    expect(getMaterialContributors(home, entities, "wood")).toHaveLength(2);
  });

  it("computes recipe breakdown, progress summary, and highlight mappings", () => {
    const home = {
      ...makeEmptyCurrentHome(),
      itemIds: ["chair", "lamp", "poster", "plush"],
      itemQuantities: { chair: 2, lamp: 1, poster: 1, plush: 1 },
      materialProgress: {
        wood: { ownedQuantity: 10 },
        nail: { ownedQuantity: 1 },
      },
    };

    expect(getBuildRecipeStatusBreakdown(home, entities)).toEqual({
      craftableWithRecipe: 2,
      nonCraftable: 1,
      unknownRecipe: 1,
    });

    const progress = getBuildProgressSummary(home, entities);
    expect(progress.totalMaterialPiecesNeeded).toBe(11);
    expect(progress.totalMaterialPiecesOwned).toBe(11);
    expect(progress.totalMaterialPiecesOwnedEffective).toBe(8);
    expect(progress.completionPercentage).toBe(73);
    expect(progress.completedMaterials).toBe(1);
    expect(progress.incompleteMaterials).toBe(2);

    expect([...getHighlightedItemIdsForMaterial(home, entities, "wood")]).toEqual(["chair", "lamp"]);
    expect([...getHoveredItemMaterialIds(home, entities, "chair")].sort()).toEqual(["nail", "wood"]);
    expect([...getMaterialIdsForBuildItem(home, entities, "chair")].sort()).toEqual(["nail", "wood"]);
  });

  it("builds compare stats for saved homes", () => {
    const savedHome: SavedHome = {
      id: "home-a",
      name: "Alpha",
      pokemonIds: [],
      itemIds: ["chair", "lamp", "poster", "plush"],
      itemQuantities: { chair: 2, lamp: 1, poster: 1, plush: 1 },
      materialProgress: {
        wood: { ownedQuantity: 10 },
        nail: { ownedQuantity: 1 },
      },
      habitatId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const stats = getBuildComparisonStats(savedHome, entities);
    expect(stats.buildName).toBe("Alpha");
    expect(stats.itemCount).toBe(4);
    expect(stats.itemQuantityTotal).toBe(5);
    expect(stats.uniqueMaterialsCount).toBe(3);
    expect(stats.totalMaterialPieces).toBe(11);
    expect(stats.craftableItemsCount).toBe(2);
    expect(stats.nonCraftableItemsCount).toBe(1);
    expect(stats.unknownRecipeItemsCount).toBe(1);
    expect(stats.completionPercentage).toBe(73);
  });
});

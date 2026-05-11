import type {
  BuildComparisonStats,
  BuildItemEntry,
  BuildProgressSummary,
  CurrentHomeState,
  EntityStore,
  MaterialAggregate,
  MaterialContributor,
  MaterialProgressEntry,
  RecipeStatusBreakdown,
  SavedHome,
} from "./models";

const normalizeToken = (value: string) => value.trim().toLowerCase();
const toSafeWholeNumber = (value: number, fallback = 0) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;

const materialIdFromName = (name: string) =>
  normalizeToken(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown_material";

const toItemQuantityEntries = (
  home: Pick<CurrentHomeState, "itemIds" | "itemQuantities">,
  entities: EntityStore,
): BuildItemEntry[] =>
  home.itemIds
    .map((itemId) => {
      const item = entities.itemsById[itemId];
      if (!item) return null;
      const quantityInBuild = toSafeWholeNumber(home.itemQuantities[itemId] ?? 1, 1);
      if (quantityInBuild <= 0) return null;
      return {
        buildItemInstanceId: item.id,
        itemId: item.id,
        itemName: item.name,
        quantityInBuild,
        item,
      } satisfies BuildItemEntry;
    })
    .filter(Boolean) as BuildItemEntry[];

const buildItemLookupByName = (entities: EntityStore) => {
  const map = new Map<string, { id: string; name: string; image?: string | null }>();
  entities.allItemIds.forEach((itemId) => {
    const item = entities.itemsById[itemId];
    map.set(normalizeToken(item.name), { id: item.id, name: item.name, image: item.image });
  });
  return map;
};

export const getBuildItemEntries = (home: CurrentHomeState, entities: EntityStore) => toItemQuantityEntries(home, entities);

export const getBuildMaterialAggregation = (
  home: CurrentHomeState,
  entities: EntityStore,
): MaterialAggregate[] => {
  const itemEntries = toItemQuantityEntries(home, entities);
  const materialByKey = new Map<string, MaterialAggregate>();
  const knownItemByName = buildItemLookupByName(entities);

  itemEntries.forEach((entry) => {
    const hasRecipe = entry.item.craftable && entry.item.materials.length > 0;
    if (!hasRecipe) return;

    entry.item.materials.forEach((material) => {
      const knownMaterialItem = knownItemByName.get(normalizeToken(material.itemName));
      const materialId = knownMaterialItem?.id ?? materialIdFromName(material.itemName);
      const materialName = knownMaterialItem?.name ?? material.itemName;
      const totalContribution = material.quantity * entry.quantityInBuild;
      if (!materialByKey.has(materialId)) {
        materialByKey.set(materialId, {
          materialId,
          materialName,
          materialItemId: knownMaterialItem?.id ?? null,
          totalNeeded: 0,
          usedByCount: 0,
          contributors: [],
        });
      }

      const aggregate = materialByKey.get(materialId)!;
      aggregate.totalNeeded += totalContribution;
      const contributor: MaterialContributor = {
        buildItemInstanceId: entry.buildItemInstanceId,
        itemId: entry.itemId,
        itemName: entry.itemName,
        quantityOfItemInBuild: entry.quantityInBuild,
        quantityPerItemRecipe: material.quantity,
        totalContribution,
      };
      aggregate.contributors.push(contributor);
    });
  });

  return [...materialByKey.values()]
    .map((aggregate) => {
      const usedByCount = new Set(aggregate.contributors.map((contributor) => contributor.itemId)).size;
      return {
        ...aggregate,
        usedByCount,
        contributors: [...aggregate.contributors].sort(
          (left, right) => right.totalContribution - left.totalContribution || left.itemName.localeCompare(right.itemName),
        ),
      };
    })
    .sort((left, right) => left.materialName.localeCompare(right.materialName));
};

export const getMaterialContributors = (
  home: CurrentHomeState,
  entities: EntityStore,
  materialId: string,
): MaterialContributor[] => getBuildMaterialAggregation(home, entities).find((entry) => entry.materialId === materialId)?.contributors ?? [];

export const getBuildRecipeStatusBreakdown = (
  home: CurrentHomeState,
  entities: EntityStore,
): RecipeStatusBreakdown => {
  const itemEntries = toItemQuantityEntries(home, entities);
  return itemEntries.reduce<RecipeStatusBreakdown>(
    (accumulator, entry) => {
      if (entry.item.craftable && entry.item.materials.length > 0) {
        accumulator.craftableWithRecipe += 1;
      } else if (!entry.item.craftable) {
        accumulator.nonCraftable += 1;
      } else {
        accumulator.unknownRecipe += 1;
      }
      return accumulator;
    },
    {
      craftableWithRecipe: 0,
      nonCraftable: 0,
      unknownRecipe: 0,
    },
  );
};

export const getBuildMaterialProgressEntries = (
  home: CurrentHomeState,
  entities: EntityStore,
): MaterialProgressEntry[] =>
  getBuildMaterialAggregation(home, entities).map((material) => {
    const ownedQuantity = toSafeWholeNumber(home.materialProgress[material.materialId]?.ownedQuantity ?? 0);
    const remainingQuantity = Math.max(material.totalNeeded - ownedQuantity, 0);

    return {
      materialId: material.materialId,
      materialName: material.materialName,
      ownedQuantity,
      totalNeeded: material.totalNeeded,
      remainingQuantity,
      isComplete: remainingQuantity === 0,
      usedByCount: material.usedByCount,
      contributors: material.contributors,
    };
  });

export const getBuildProgressSummary = (
  home: CurrentHomeState,
  entities: EntityStore,
): BuildProgressSummary => {
  const entries = getBuildMaterialProgressEntries(home, entities);
  const totalMaterialPiecesNeeded = entries.reduce((sum, entry) => sum + entry.totalNeeded, 0);
  const totalMaterialPiecesOwned = entries.reduce((sum, entry) => sum + entry.ownedQuantity, 0);
  const totalMaterialPiecesOwnedEffective = entries.reduce(
    (sum, entry) => sum + Math.min(entry.ownedQuantity, entry.totalNeeded),
    0,
  );

  const completedMaterials = entries.filter((entry) => entry.isComplete).length;
  const incompleteMaterials = entries.filter((entry) => !entry.isComplete).length;
  const completionPercentage =
    totalMaterialPiecesNeeded === 0
      ? 100
      : Math.round((totalMaterialPiecesOwnedEffective / totalMaterialPiecesNeeded) * 100);

  return {
    completedMaterials,
    incompleteMaterials,
    totalMaterials: entries.length,
    totalMaterialPiecesNeeded,
    totalMaterialPiecesOwned,
    totalMaterialPiecesOwnedEffective,
    completionPercentage,
  };
};

export const getHighlightedItemIdsForMaterial = (
  home: CurrentHomeState,
  entities: EntityStore,
  materialId: string,
): Set<string> => new Set(getMaterialContributors(home, entities, materialId).map((contributor) => contributor.itemId));

export const getHoveredItemMaterialIds = (
  home: CurrentHomeState,
  entities: EntityStore,
  itemId: string,
): Set<string> => {
  const aggregates = getBuildMaterialAggregation(home, entities);
  return new Set(
    aggregates
      .filter((aggregate) => aggregate.contributors.some((contributor) => contributor.itemId === itemId))
      .map((aggregate) => aggregate.materialId),
  );
};

export const getMaterialIdsForBuildItem = (
  home: CurrentHomeState,
  entities: EntityStore,
  buildItemInstanceId: string,
): Set<string> => {
  const aggregates = getBuildMaterialAggregation(home, entities);
  return new Set(
    aggregates
      .filter((aggregate) =>
        aggregate.contributors.some(
          (contributor) => contributor.buildItemInstanceId === buildItemInstanceId,
        ),
      )
      .map((aggregate) => aggregate.materialId),
  );
};

export const getBuildComparisonStats = (
  build: SavedHome,
  entities: EntityStore,
): BuildComparisonStats => {
  const normalizedHome: CurrentHomeState = {
    id: build.id,
    name: build.name,
    pokemonIds: [...build.pokemonIds],
    itemIds: [...build.itemIds],
    itemQuantities: { ...build.itemQuantities },
    materialProgress: { ...build.materialProgress },
    habitatId: build.habitatId,
    isDirty: false,
    lastSavedAt: build.updatedAt,
  };
  const itemEntries = toItemQuantityEntries(normalizedHome, entities);
  const aggregates = getBuildMaterialAggregation(normalizedHome, entities);
  const progressSummary = getBuildProgressSummary(normalizedHome, entities);
  const recipeStatus = getBuildRecipeStatusBreakdown(normalizedHome, entities);

  return {
    buildId: build.id,
    buildName: build.name,
    itemCount: itemEntries.length,
    itemQuantityTotal: itemEntries.reduce((sum, entry) => sum + entry.quantityInBuild, 0),
    uniqueMaterialsCount: aggregates.length,
    totalMaterialPieces: aggregates.reduce((sum, aggregate) => sum + aggregate.totalNeeded, 0),
    craftableItemsCount: recipeStatus.craftableWithRecipe,
    nonCraftableItemsCount: recipeStatus.nonCraftable,
    unknownRecipeItemsCount: recipeStatus.unknownRecipe,
    completionPercentage: progressSummary.completionPercentage,
  };
};

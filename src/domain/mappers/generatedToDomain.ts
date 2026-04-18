import { generatedFavoriteCategories } from "../../data/generated/favoriteCategories";
import { generatedFavoriteItems } from "../../data/generated/favoriteItems";
import { generatedHabitats } from "../../data/generated/habitats";
import { generatedItems } from "../../data/generated/items";
import { generatedPokemon } from "../../data/generated/pokemon";
import { habitatTraits as seedHabitatTraits } from "../../data/seed";
import { inferHabitatTraitIds } from "./traitInference";
import type {
  FavoriteCategory,
  Habitat,
  HabitatTrait,
  Item,
  Location,
  Pokemon,
  Specialty,
} from "../types";

const titleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const pokemonCountsByDex = new Map<number, number>();
generatedPokemon.forEach((entry) => {
  if (typeof entry.dexNumber === "number") {
    pokemonCountsByDex.set(entry.dexNumber, (pokemonCountsByDex.get(entry.dexNumber) ?? 0) + 1);
  }
});

export const mapGeneratedHabitatTraitsToDomain = (): HabitatTrait[] => [...seedHabitatTraits];

export const mapGeneratedFavoriteCategoriesToDomain = (): FavoriteCategory[] => {
  const categoryNameById = new Map<string, string>();
  const categorySlugById = new Map<string, string>();
  const categoryDescriptionById = new Map<string, string | null>();
  const categorySourceTypeById = new Map<string, string | null>();
  const itemIdsByCategoryId = new Map<string, Set<string>>();

  generatedFavoriteCategories.forEach((category) => {
    categoryNameById.set(category.id, category.name);
    categorySlugById.set(category.id, category.sourceSlug);
    categoryDescriptionById.set(category.id, category.description ?? null);
    categorySourceTypeById.set(category.id, category.sourceType ?? null);
    itemIdsByCategoryId.set(category.id, new Set(category.itemIds));
  });

  generatedPokemon.forEach((entry) => {
    entry.favorites.forEach((categoryId, index) => {
      const label = entry.sourceLabels?.favorites?.[index];
      if (label && !categoryNameById.has(categoryId)) {
        categoryNameById.set(categoryId, label);
      }
      if (!categorySlugById.has(categoryId)) {
        categorySlugById.set(categoryId, categoryId.replace(/_/g, ""));
      }
      if (!itemIdsByCategoryId.has(categoryId)) {
        itemIdsByCategoryId.set(categoryId, new Set());
      }
    });
  });

  generatedFavoriteItems.forEach((item) => {
    item.favoriteCategoryIds.forEach((categoryId, index) => {
      const label = item.sourceLabels?.favoriteCategories?.[index];
      if (label && !categoryNameById.has(categoryId)) {
        categoryNameById.set(categoryId, label);
      }
      if (!categorySlugById.has(categoryId)) {
        categorySlugById.set(categoryId, categoryId.replace(/_/g, ""));
      }
      const itemIds = itemIdsByCategoryId.get(categoryId) ?? new Set<string>();
      itemIds.add(item.id);
      itemIdsByCategoryId.set(categoryId, itemIds);
    });
  });

  return [...categoryNameById.keys()]
    .sort((left, right) => left.localeCompare(right))
    .map((categoryId) => ({
      id: categoryId,
      name: categoryNameById.get(categoryId) ?? titleCase(categoryId),
      slug: categorySlugById.get(categoryId) ?? categoryId.replace(/_/g, ""),
      description: categoryDescriptionById.get(categoryId) ?? null,
      itemIds: [...(itemIdsByCategoryId.get(categoryId) ?? new Set<string>())].sort((left, right) =>
        left.localeCompare(right),
      ),
      sourceType: categorySourceTypeById.get(categoryId) ?? null,
    }));
};

export const mapGeneratedHabitatsToDomain = (): Habitat[] =>
  generatedHabitats.map((habitat) => ({
    id: habitat.id,
    number: habitat.number,
    name: habitat.name,
    slug: habitat.slug,
    traitIds: inferHabitatTraitIds(habitat.name, habitat.description),
    requiredItems: (habitat.requiredItems ?? []).map((entry) => ({
      itemId: entry.itemId,
      itemName: entry.itemName,
      quantity: entry.quantity,
    })),
    description: habitat.description,
    imageUrl: habitat.imageUrl,
    sourceUrl: habitat.sourceUrl,
  }));

export const mapGeneratedItemsToDomain = (): Item[] =>
  (() => {
    const favoriteItemById = new Map<string, (typeof generatedFavoriteItems)[number]>(
      generatedFavoriteItems.map((entry) => [entry.id, entry]),
    );
    return generatedItems.map((baseItem) => {
      const favoriteItem = favoriteItemById.get(baseItem.id);
    const itemCategoryLabel = favoriteItem?.itemCategoryLabel ?? baseItem.itemCategoryLabel ?? "Unknown";
    const itemCategory = favoriteItem?.itemCategory ?? baseItem.itemCategory ?? "unknown";
    const favoriteCategoryIds = [...(favoriteItem?.favoriteCategoryIds ?? [])];
    const benefitingPokemonIds = [...(favoriteItem?.benefitingPokemonIds ?? [])];
    const favoriteSourceLabels = [...(favoriteItem?.sourceLabels?.favoriteCategories ?? [])];

    return {
      id: baseItem.id,
      name: favoriteItem?.name ?? baseItem.name,
      slug: favoriteItem?.sourceSlug ?? baseItem.sourceSlug,
      imageUrl: favoriteItem?.imageUrl ?? baseItem.imageUrl,
      itemCategory,
      itemCategoryLabel,
      comfortCategoryIds: [...(baseItem.comfortCategoryIds ?? [])],
      comfortCategoryLabels: [...(baseItem.comfortCategoryLabels ?? [])],
      favoriteCategoryIds,
      benefitingPokemonIds,
      habitatTraitIds: inferHabitatTraitIds(
        favoriteItem?.name ?? baseItem.name,
        itemCategoryLabel,
        itemCategory,
        ...favoriteCategoryIds,
        ...favoriteSourceLabels,
      ),
      craftable: (baseItem.recipeMaterials?.length ?? 0) > 0,
      materials: (baseItem.recipeMaterials ?? []).map((material) => ({
        itemName: material.itemName,
        quantity: material.quantity,
      })),
      obtainabilityDetails: [...(baseItem.obtainabilityDetails ?? [])],
      sources: [
        ...(itemCategoryLabel ? [{ type: "unknown" as const, label: itemCategoryLabel }] : []),
        ...(baseItem.recipeLocation ? [{ type: "craft" as const, label: baseItem.recipeLocation }] : []),
        ...((baseItem.obtainabilityDetails ?? []).map((detail) => ({
          type: "unknown" as const,
          label: detail,
        })) ?? []),
      ],
      availabilityConfidence: "low",
      sourceLabels: {
        category: itemCategoryLabel,
        favoriteCategories: favoriteSourceLabels,
      },
    };
    });
  })();

export const mapGeneratedSpecialtiesToDomain = (): Specialty[] => {
  const labelById = new Map<string, string>();
  generatedPokemon.forEach((entry) => {
    entry.specialties.forEach((specialtyId, index) => {
      const sourceLabel = entry.sourceLabels?.specialties?.[index];
      if (sourceLabel && !labelById.has(specialtyId)) {
        labelById.set(specialtyId, sourceLabel);
      }
    });
  });

  return [...new Set(generatedPokemon.flatMap((entry) => entry.specialties))]
    .sort((left, right) => left.localeCompare(right))
    .map((specialtyId) => ({
      id: specialtyId,
      name: labelById.get(specialtyId) ?? titleCase(specialtyId),
      slug: specialtyId,
    }));
};

export const mapGeneratedLocationsToDomain = (): Location[] =>
  [...new Set(generatedPokemon.flatMap((entry) => entry.locations))]
    .sort((left, right) => left.localeCompare(right))
    .map((locationId) => ({
      id: locationId,
      name: titleCase(locationId),
      slug: locationId,
    }));

export const mapGeneratedPokemonToDomain = (): Pokemon[] =>
  generatedPokemon.map((entry) => {
    const duplicateDexEntryCount =
      typeof entry.dexNumber === "number" ? (pokemonCountsByDex.get(entry.dexNumber) ?? 1) : 1;
    const hasForms = duplicateDexEntryCount > 1;
    const sourceSlug = entry.sourceSlug;
    const speciesId =
      typeof entry.dexNumber === "number" && hasForms ? `species-${String(entry.dexNumber).padStart(3, "0")}` : entry.id;
    const formId = hasForms ? entry.id : null;

    return {
      id: entry.id,
      slug: sourceSlug,
      dexNumber: entry.dexNumber ?? null,
      name: entry.name,
      formName: hasForms ? entry.name : null,
      fullDisplayName: entry.name,
      speciesId,
      formId,
      typeIds: [...(entry.types ?? [])],
      specialtyIds: [...entry.specialties],
      favoriteCategoryIds: [...entry.favorites],
      idealHabitatTraitIds: entry.idealHabitat ? [entry.idealHabitat] : [],
      habitatIds: [...entry.habitats],
      locationIds: [...entry.locations],
      evolutionFamilyId: null,
      description: entry.sourceNotes ?? null,
      imageUrl: entry.imageUrl ?? null,
      source: {
        sourceSlug,
        sourceLabels: {
          idealHabitat: entry.sourceLabels?.idealHabitat ?? null,
          favorites: [...(entry.sourceLabels?.favorites ?? [])],
          specialties: [...(entry.sourceLabels?.specialties ?? [])],
          types: [...(entry.sourceLabels?.types ?? [])],
          habitats: [],
        },
        sourceNotes: entry.sourceNotes ?? null,
        timeOfDay: [...(entry.timeOfDay ?? [])],
        weather: [...(entry.weather ?? [])],
        duplicateDexEntryCount,
      },
    };
  });

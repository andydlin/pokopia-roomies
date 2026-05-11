import { habitats, items, pokemon } from "../data";
import type { EntityStore, HomeBuilderHabitat, HomeBuilderItem, HomeBuilderPokemon } from "./models";

const byName = <T extends { name: string }>(left: T, right: T) => left.name.localeCompare(right.name);

const mappedPokemon: HomeBuilderPokemon[] = pokemon
  .map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.fullDisplayName,
    typeIds: [...entry.typeIds],
    favoriteCategoryIds: [...entry.favoriteCategoryIds],
    idealHabitatId: entry.idealHabitatTraitIds[0] ?? entry.habitatIds[0] ?? null,
    habitatIds: [...entry.habitatIds],
    specialtyIds: [...entry.specialtyIds],
    imageUrl: entry.imageUrl ?? null,
  }))
  .sort(byName);

const mappedItems: HomeBuilderItem[] = items
  .map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    image: entry.imageUrl ?? null,
    generalCategoryId: entry.itemCategory ?? "unknown",
    generalCategoryLabel: entry.itemCategoryLabel ?? "Unknown",
    comfortCategoryIds: [...entry.comfortCategoryIds],
    comfortCategoryLabels: [...entry.comfortCategoryLabels],
    favoriteCategoryIds: [...entry.favoriteCategoryIds],
    isComfortRelevant: entry.comfortCategoryIds.length > 0,
    craftable: entry.craftable,
    materials: entry.materials.map((material) => ({
      itemName: material.itemName,
      quantity: material.quantity,
    })),
    obtainabilityDetails: [...(entry.obtainabilityDetails ?? [])],
    sources: entry.sources.map((source) => ({
      type: source.type,
      label: source.label,
    })),
  }))
  .sort(byName);

const mappedHabitats: HomeBuilderHabitat[] = habitats
  .map((entry) => {
    const categorySet = new Set<string>();
    (entry.requiredItems ?? []).forEach((requirement) => {
      const item = mappedItems.find((candidate) => candidate.id === requirement.itemId);
      item?.comfortCategoryIds.forEach((categoryId) => categorySet.add(categoryId));
    });

    return {
      id: entry.id,
      slug: entry.slug,
      name: entry.name,
      image: entry.imageUrl ?? null,
      relatedComfortCategoryIds: [...categorySet],
      requiredItems: (entry.requiredItems ?? []).map((requiredItem) => ({
        itemId: requiredItem.itemId,
        itemName: requiredItem.itemName,
        quantity: requiredItem.quantity,
      })),
    };
  })
  .sort(byName);

const toMap = <T extends { id: string }>(entries: T[]) =>
  entries.reduce<Record<string, T>>((accumulator, entry) => {
    accumulator[entry.id] = entry;
    return accumulator;
  }, {});

export const entityStore: EntityStore = {
  pokemonById: toMap(mappedPokemon),
  itemsById: toMap(mappedItems),
  habitatsById: toMap(mappedHabitats),
  allPokemonIds: mappedPokemon.map((entry) => entry.id),
  allItemIds: mappedItems.map((entry) => entry.id),
  allHabitatIds: mappedHabitats.map((entry) => entry.id),
};

export const allPokemon = mappedPokemon;
export const allItems = mappedItems;
export const allHabitats = mappedHabitats;

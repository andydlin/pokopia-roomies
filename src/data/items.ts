import { generatedFavoriteItems } from "./generated/favoriteItems";
import type { Item } from "../lib/types";

export const items: Item[] = generatedFavoriteItems.map((item) => ({
  id: item.id,
  name: item.name,
  slug: item.sourceSlug,
  favoriteCategoryIds: [...item.favoriteCategoryIds],
  craftable: false,
}));
export const itemById = new Map(items.map((item) => [item.id, item]));
export const itemBySlug = new Map(items.map((item) => [item.slug, item]));

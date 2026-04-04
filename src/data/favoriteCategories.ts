import { generatedFavoriteCategories } from "./generated/favoriteCategories";
import type { FavoriteCategory } from "../lib/types";

export const favoriteCategories: FavoriteCategory[] = generatedFavoriteCategories.map((category) => ({
  id: category.id,
  name: category.name,
  slug: category.sourceSlug,
  description: category.description,
  itemIds: [...category.itemIds],
}));
export const favoriteCategoryById = new Map(favoriteCategories.map((category) => [category.id, category]));
export const favoriteCategoryBySlug = new Map(
  favoriteCategories.map((category) => [category.slug, category]),
);

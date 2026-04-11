export { items, favoriteItems, nonFavoriteItems, itemById, itemBySlug } from "../domain/data";

export const comfortItemCategoryOptions = [
  { id: "decoration", label: "Decoration" },
  { id: "food", label: "Food" },
  { id: "relaxation", label: "Relaxation" },
  { id: "road", label: "Road" },
  { id: "toy", label: "Toy" },
] as const;

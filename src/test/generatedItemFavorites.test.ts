import { describe, expect, it } from "vitest";
import { generatedFavoriteItems } from "../data/generated/favoriteItems";
import { generatedItems } from "../data/generated/items";

const byId = <T extends { id: string }>(entries: readonly T[]) =>
  new Map(entries.map((entry) => [entry.id, entry]));

describe("generated item ↔ favorite category mapping", () => {
  it("keeps generatedFavoriteItems non-empty", () => {
    expect(generatedFavoriteItems.length).toBeGreaterThan(0);
  });

  it("contains known favorite mappings from Serebii categories", () => {
    const favoriteItemById = byId(generatedFavoriteItems);

    expect(favoriteItemById.get("antiquebed")?.favoriteCategoryIds).toContain("group_activities");
    expect(favoriteItemById.get("arcaninedoll")?.favoriteCategoryIds).toContain("cute_stuff");
    expect(favoriteItemById.get("potato")?.favoriteCategoryIds).toContain("bitter_flavor");
  });

  it("allows some items to remain outside favorite categories", () => {
    const emptyFavoriteMappings = generatedItems.filter((item) => (item.favoriteCategoryIds ?? []).length === 0);
    expect(emptyFavoriteMappings.length).toBeGreaterThan(0);
  });

  it("keeps generatedItems and generatedFavoriteItems favorite mappings aligned", () => {
    const favoriteItemById = byId(generatedFavoriteItems);

    generatedItems.forEach((item) => {
      const favoriteItem = favoriteItemById.get(item.id);
      expect(favoriteItem).toBeTruthy();

      const itemFavorites = [...new Set(item.favoriteCategoryIds ?? [])].sort();
      const favoriteItemFavorites = [...new Set(favoriteItem?.favoriteCategoryIds ?? [])].sort();
      expect(itemFavorites).toEqual(favoriteItemFavorites);
    });
  });
});

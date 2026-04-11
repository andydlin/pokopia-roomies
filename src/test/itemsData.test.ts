import { describe, expect, it } from "vitest";
import { comfortItemCategoryOptions, favoriteItems, itemById, items, nonFavoriteItems } from "../data/items";

describe("item datasets", () => {
  it("stores a full item database plus a favorite-linked subset", () => {
    expect(items.length).toBeGreaterThan(favoriteItems.length);
    expect(nonFavoriteItems.length).toBeGreaterThan(0);
  });

  it("keeps favorite-linked items inside the full item database", () => {
    favoriteItems.forEach((item) => {
      expect(itemById.has(item.id)).toBe(true);
      expect(item.favoriteCategoryIds.length).toBeGreaterThan(0);
    });
  });

  it("includes non-favorite categories like food/key items in the full item set", () => {
    expect(
      nonFavoriteItems.some((item) =>
        ["food", "key_items", "kits"].includes(item.itemCategory ?? ""),
      ),
    ).toBe(true);
  });

  it("captures comfort-focused browse categories from item tags", () => {
    const expectedComfortIds = comfortItemCategoryOptions.map((option) => option.id);
    expectedComfortIds.forEach((categoryId) => {
      expect(items.some((item) => item.comfortCategoryIds.includes(categoryId))).toBe(true);
    });
  });
});

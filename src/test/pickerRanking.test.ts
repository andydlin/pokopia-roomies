import { describe, expect, it } from "vitest";
import { rankItemForHomeContext } from "../domain/home-builder/logic";
import type { CategoryCoverageState, HomeBuilderItem, HomeCategoryStrength } from "../domain/home-builder/models";

const makeItem = (overrides: Partial<HomeBuilderItem>): HomeBuilderItem => ({
  id: "item",
  slug: "item",
  name: "Item",
  image: null,
  generalCategoryId: "decor",
  generalCategoryLabel: "Decor",
  comfortCategoryIds: [],
  comfortCategoryLabels: [],
  favoriteCategoryIds: [],
  isComfortRelevant: false,
  craftable: false,
  materials: [],
  obtainabilityDetails: [],
  sources: [],
  ...overrides,
});

describe("item contextual ranking", () => {
  it("keeps neutral items in the neutral bucket with zero score", () => {
    const ranked = rankItemForHomeContext(makeItem({ isComfortRelevant: false }), {}, {});
    expect(ranked.bucket).toBe("neutral");
    expect(ranked.score).toBe(0);
  });

  it("promotes strong overlaps into best_match", () => {
    const strengths: Record<string, HomeCategoryStrength> = {
      soft_stuff: {
        categoryId: "soft_stuff",
        count: 3,
        totalPokemon: 3,
        shareType: "all",
      },
    };

    const coverage: Record<string, CategoryCoverageState> = {
      soft_stuff: {
        categoryId: "soft_stuff",
        demandCount: 3,
        supplyCount: 0,
        state: "missing",
      },
    };

    const ranked = rankItemForHomeContext(
      makeItem({
        isComfortRelevant: true,
        comfortCategoryIds: ["soft_stuff"],
      }),
      strengths,
      coverage,
    );

    expect(ranked.bucket).toBe("best_match");
    expect(ranked.fillsMissingCategoryIds).toEqual(["soft_stuff"]);
    expect(ranked.score).toBeGreaterThanOrEqual(125);
  });
});

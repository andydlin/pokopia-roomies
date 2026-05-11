import { describe, expect, it } from "vitest";
import { entityStore } from "../domain/home-builder/entities";

describe("home-builder item dataset", () => {
  it("includes neutral and comfort-relevant items together", () => {
    const items = entityStore.allItemIds.map((id) => entityStore.itemsById[id]);
    const neutral = items.filter((item) => !item.isComfortRelevant);
    const comfort = items.filter((item) => item.isComfortRelevant);

    expect(items.length).toBeGreaterThan(0);
    expect(neutral.length).toBeGreaterThan(0);
    expect(comfort.length).toBeGreaterThan(0);
  });

  it("retains browseable general categories even for neutral items", () => {
    const neutralWithCategory = entityStore.allItemIds
      .map((id) => entityStore.itemsById[id])
      .filter((item) => !item.isComfortRelevant && item.generalCategoryId.length > 0);

    expect(neutralWithCategory.length).toBeGreaterThan(0);
  });
});

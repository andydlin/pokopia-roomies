import { describe, expect, it } from "vitest";
import { pokemonById } from "../data/pokemon";
import {
  findPokemonMatches,
  getItemsForFavoriteCategory,
  getRecommendedCategories,
  getRecommendedItems,
  getSharedFavoriteCategories,
  getSharedFavoriteCategoriesAny,
} from "../lib/data/selectors";

const getPokemon = (...ids: string[]) => ids.map((id) => pokemonById.get(id)!);

describe("favorite overlap selectors", () => {
  it("returns categories shared across all members", () => {
    expect(getSharedFavoriteCategories(getPokemon("charmander", "vulpix"))).toEqual(
      expect.arrayContaining(["lots_of_fire"]),
    );
  });

  it("returns categories shared by any pair in the team", () => {
    expect(getSharedFavoriteCategoriesAny(getPokemon("pikachu", "eevee", "oddish"))).toEqual(
      expect.arrayContaining(["group_activities"]),
    );
  });
});

describe("item recommendation selectors", () => {
  it("resolves category-to-items", () => {
    const items = getItemsForFavoriteCategory("lots_of_fire");
    expect(items.map((item) => item.id)).toEqual(expect.arrayContaining(["bonfire", "campfire"]));
  });

  it("ranks recommended categories and items by coverage", () => {
    const group = getPokemon("eevee", "meowth", "slowpoke");
    expect(getRecommendedCategories(group)[0].categoryId).toBe("soft_stuff");
    expect(getRecommendedItems(group)[0].matchedPokemonIds.length).toBeGreaterThanOrEqual(2);
  });
});

describe("reverse lookup", () => {
  it("combines category and specialty filters", () => {
    const results = findPokemonMatches({
      query: "",
      favoriteCategoryId: "luxury",
      itemId: "all",
      habitatTraitId: "all",
      specialtyId: "trade",
    });

    expect(results.map((entry) => entry.pokemonId)).toEqual(expect.arrayContaining(["meowth", "persian"]));
  });
});

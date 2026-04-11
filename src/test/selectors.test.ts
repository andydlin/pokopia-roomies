import { describe, expect, it } from "vitest";
import { habitatById } from "../data/habitats";
import { pokemonById } from "../data/pokemon";
import {
  findPokemonMatches,
  getBestHabitatsForTeam,
  getHabitatFitItems,
  getHabitatCoverageBreakdown,
  getRecommendedItemsForHabitat,
  getItemsForFavoriteCategory,
  getRecommendedCategories,
  getRecommendedItems,
  getSharedFavoriteCategories,
  getSharedFavoriteCategoriesAny,
} from "../lib/data/selectors";

const getPokemon = (...ids: string[]) => ids.map((id) => pokemonById.get(id)!);

describe("favorite overlap selectors", () => {
  it("stores elemental types for pokemon", () => {
    const pikachu = pokemonById.get("pikachu");
    const bulbasaur = pokemonById.get("bulbasaur");
    expect(pikachu?.typeIds).toEqual(["electric"]);
    expect(bulbasaur?.typeIds).toEqual(expect.arrayContaining(["grass", "poison"]));
  });

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
      comfortCategoryId: "all",
      itemId: "all",
      habitatTraitId: "all",
      specialtyId: "trade",
    });

    expect(results.map((entry) => entry.pokemonId)).toEqual(expect.arrayContaining(["meowth", "persian"]));
  });

  it("supports comfort tag filtering", () => {
    const results = findPokemonMatches({
      query: "",
      favoriteCategoryId: "all",
      comfortCategoryId: "food",
      itemId: "all",
      habitatTraitId: "all",
      specialtyId: "all",
    });
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("habitat-aware selectors", () => {
  it("stores required items for habitats", () => {
    const habitat = habitatById.get("tree_shaded_tall_grass");
    expect(habitat).toBeTruthy();
    expect(habitat?.requiredItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemId: "tall_grass", quantity: 4 }),
        expect.objectContaining({ itemId: "tree", quantity: 1 }),
      ]),
    );
  });

  it("returns habitat-fit items for a habitat", () => {
    const habitatId = "campsite";
    expect(habitatById.get(habitatId)).toBeTruthy();
    expect(getHabitatFitItems(habitatId).length).toBeGreaterThan(0);
  });

  it("derives habitat-aware coverage for a team", () => {
    const group = getPokemon("pikachu", "meowth");
    const habitatId = getBestHabitatsForTeam(group)[0].habitatId;
    const coverage = getHabitatCoverageBreakdown(group, habitatId);
    expect(coverage.habitatFitItemIds.length).toBeGreaterThan(0);
    expect(coverage.pokemonCoverage.length).toBe(group.length);
    expect(coverage.averagePokemonCoverageRatio).toBeGreaterThan(0);
  });

  it("filters recommended items by habitat fit", () => {
    const group = getPokemon("pikachu", "meowth");
    const habitatId = getBestHabitatsForTeam(group)[0].habitatId;
    const recommendations = getRecommendedItemsForHabitat(group, habitatId);
    expect(recommendations.every((entry) => entry.habitatId === habitatId)).toBe(true);
  });
});

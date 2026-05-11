import { describe, expect, it } from "vitest";
import { entityStore } from "../domain/home-builder/entities";
import {
  makeEmptyCurrentHome,
  selectHomeCategoryCoverage,
  selectHomeCategoryStrengths,
  selectRankedPokemonForCurrentHome,
  selectSuggestionsForCurrentHome,
} from "../domain/home-builder/logic";
import type { EntityStore, HomeBuilderHabitat, HomeBuilderItem, HomeBuilderPokemon } from "../domain/home-builder/models";

const buildHome = () => ({
  ...makeEmptyCurrentHome(),
  pokemonIds: ["pikachu", "meowth", "eevee"],
  itemIds: [],
  habitatId: "cave",
});

describe("home category strength + coverage", () => {
  it("derives share types from selected pokemon", () => {
    const strengths = Object.values(selectHomeCategoryStrengths(buildHome(), entityStore));
    expect(strengths.length).toBeGreaterThan(0);
    expect(strengths.some((entry) => ["all", "most", "some", "single"].includes(entry.shareType))).toBe(true);
  });

  it("marks categories as missing when no comfort items are selected", () => {
    const coverage = Object.values(selectHomeCategoryCoverage(buildHome(), entityStore));
    expect(coverage.length).toBeGreaterThan(0);
    expect(coverage.some((entry) => entry.state === "missing")).toBe(true);
  });
});

describe("suggestion priority behavior", () => {
  it("raises habitat conflict and missing category suggestions without blocking choices", () => {
    const suggestions = selectSuggestionsForCurrentHome(buildHome(), entityStore);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((entry) => entry.kind === "habitat_conflict")).toBe(true);
    expect(suggestions.some((entry) => entry.kind === "missing_category")).toBe(true);
  });
});

const pokemon = (overrides: Partial<HomeBuilderPokemon> & Pick<HomeBuilderPokemon, "id" | "name">): HomeBuilderPokemon => {
  const { id, name, ...rest } = overrides;
  return {
    id,
    slug: id,
    name,
    typeIds: [],
    favoriteCategoryIds: [],
    idealHabitatId: null,
    habitatIds: [],
    specialtyIds: [],
    imageUrl: null,
    ...rest,
  };
};

const habitat = (id: string, name: string): HomeBuilderHabitat => ({
  id,
  slug: id,
  name,
  relatedComfortCategoryIds: [],
  image: null,
  requiredItems: [],
});

const testEntities: EntityStore = {
  pokemonById: {
    selectedA: pokemon({ id: "selectedA", name: "Selected A", idealHabitatId: "bright", favoriteCategoryIds: ["cozy", "breezy", "luxury"] }),
    selectedB: pokemon({ id: "selectedB", name: "Selected B", idealHabitatId: "bright", favoriteCategoryIds: ["cozy", "breezy", "wooden"] }),
    selectedC: pokemon({ id: "selectedC", name: "Selected C", idealHabitatId: "cave", favoriteCategoryIds: ["cozy", "spicy"] }),
    candidateStrong: pokemon({
      id: "candidateStrong",
      name: "Candidate Strong",
      idealHabitatId: "cave",
      favoriteCategoryIds: ["cozy", "breezy", "luxury"],
    }),
    candidateOneOffHabitat: pokemon({
      id: "candidateOneOffHabitat",
      name: "Candidate One-Off Habitat",
      idealHabitatId: "bright",
      favoriteCategoryIds: ["luxury"],
    }),
    candidateReinforce: pokemon({
      id: "candidateReinforce",
      name: "Candidate Reinforce",
      idealHabitatId: "humid",
      favoriteCategoryIds: ["cozy", "breezy"],
    }),
    candidateWeakHabitat: pokemon({ id: "candidateWeakHabitat", name: "Candidate Weak Habitat", idealHabitatId: "bright", favoriteCategoryIds: [] }),
    candidateUnknown: pokemon({ id: "candidateUnknown", name: "Candidate Unknown", idealHabitatId: null }),
  },
  itemsById: {} as Record<string, HomeBuilderItem>,
  habitatsById: {
    bright: habitat("bright", "Bright Habitat"),
    cave: habitat("cave", "Cave Habitat"),
  },
  allPokemonIds: [
    "selectedA",
    "selectedB",
    "selectedC",
    "candidateStrong",
    "candidateOneOffHabitat",
    "candidateReinforce",
    "candidateWeakHabitat",
    "candidateUnknown",
  ],
  allItemIds: [],
  allHabitatIds: ["bright", "cave"],
};

describe("pokemon group-fit ranking", () => {
  it("ranks candidates matching multiple selected pokemon above one-off overlaps", () => {
    const home = {
      ...makeEmptyCurrentHome(),
      pokemonIds: ["selectedA", "selectedB"],
    };

    const ranked = selectRankedPokemonForCurrentHome(home, testEntities);
    const strongIndex = ranked.findIndex((entry) => entry.pokemon.id === "candidateStrong");
    const oneOffIndex = ranked.findIndex((entry) => entry.pokemon.id === "candidateOneOffHabitat");

    expect(strongIndex).toBeGreaterThanOrEqual(0);
    expect(oneOffIndex).toBeGreaterThanOrEqual(0);
    expect(strongIndex).toBeLessThan(oneOffIndex);
    expect(ranked[strongIndex].section).toBe("strong");
  });

  it("ranks reinforcement-heavy overlaps as strong fits", () => {
    const home = {
      ...makeEmptyCurrentHome(),
      pokemonIds: ["selectedA", "selectedB", "selectedC"],
    };

    const ranked = selectRankedPokemonForCurrentHome(home, testEntities);
    const reinforce = ranked.find((entry) => entry.pokemon.id === "candidateReinforce");
    const oneOff = ranked.find((entry) => entry.pokemon.id === "candidateOneOffHabitat");

    expect(reinforce?.matchedCategoryIds).toEqual(expect.arrayContaining(["cozy", "breezy"]));
    expect((reinforce?.score ?? 0)).toBeGreaterThan(oneOff?.score ?? 0);
    expect(reinforce?.section).toBe("strong");
  });

  it("does not let habitat overpower stronger favorite overlap", () => {
    const home = {
      ...makeEmptyCurrentHome(),
      pokemonIds: ["selectedA", "selectedB"],
    };

    const ranked = selectRankedPokemonForCurrentHome(home, testEntities);
    const strong = ranked.find((entry) => entry.pokemon.id === "candidateStrong");
    const weakHabitat = ranked.find((entry) => entry.pokemon.id === "candidateWeakHabitat");

    expect(strong?.matchedCategoryIds.length).toBeGreaterThan(weakHabitat?.matchedCategoryIds.length ?? 0);
    expect((strong?.score ?? 0)).toBeGreaterThan(weakHabitat?.score ?? 0);
  });

  it("assigns candidates into strong/good/some/none sections", () => {
    const home = {
      ...makeEmptyCurrentHome(),
      pokemonIds: ["selectedA", "selectedB", "selectedC"],
    };
    const ranked = selectRankedPokemonForCurrentHome(home, testEntities);
    const byId = new Map(ranked.map((entry) => [entry.pokemon.id, entry]));

    expect(byId.get("candidateStrong")?.section).toBe("strong");
    expect(byId.get("candidateReinforce")?.section).toBe("strong");
    expect(byId.get("candidateOneOffHabitat")?.section).toBe("some");
    expect(byId.get("candidateWeakHabitat")?.section).toBe("none");
  });

  it("keeps default browse behavior when no pokemon are selected", () => {
    const home = makeEmptyCurrentHome();
    const ranked = selectRankedPokemonForCurrentHome(home, testEntities);

    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.some((entry) => entry.score === 0)).toBe(true);
  });
});

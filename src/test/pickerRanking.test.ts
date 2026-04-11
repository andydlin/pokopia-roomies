import { describe, expect, it } from "vitest";
import type { Pokemon } from "../lib/types";
import { groupPokemonPickerCandidates, rankPokemonPickerCandidates } from "../lib/teams/pickerRanking";

const makePokemon = (overrides: Partial<Pokemon>): Pokemon => ({
  id: "id",
  slug: "slug",
  dexNumber: null,
  name: "Name",
  formName: null,
  fullDisplayName: "Name",
  speciesId: "species",
  formId: null,
  typeIds: ["normal"],
  specialtyIds: [],
  favoriteCategoryIds: [],
  idealHabitatTraitIds: [],
  habitatIds: [],
  locationIds: [],
  evolutionFamilyId: null,
  description: null,
  imageUrl: null,
  source: {
    sourceSlug: "source",
    duplicateDexEntryCount: 1,
  },
  ...overrides,
});

describe("picker ranking", () => {
  it("keeps browse mode alphabetical when nothing is selected", () => {
    const ranked = rankPokemonPickerCandidates({
      selected: [],
      available: [
        makePokemon({ id: "b", fullDisplayName: "Bulbasaur" }),
        makePokemon({ id: "a", fullDisplayName: "Abra" }),
      ],
      query: "",
    });

    expect(ranked.map((entry) => entry.entry.fullDisplayName)).toEqual(["Abra", "Bulbasaur"]);
    expect(ranked.every((entry) => entry.sectionId === null)).toBe(true);
  });

  it("ranks strong shared-favorite candidates first and keeps weak matches visible", () => {
    const selected = [
      makePokemon({
        id: "pikachu",
        favoriteCategoryIds: ["group_activities", "glass_stuff"],
        habitatIds: ["city"],
      }),
      makePokemon({
        id: "meowth",
        favoriteCategoryIds: ["group_activities", "luxury"],
        habitatIds: ["city"],
      }),
    ];
    const ranked = rankPokemonPickerCandidates({
      selected,
      available: [
        makePokemon({
          id: "top",
          fullDisplayName: "Top Match",
          favoriteCategoryIds: ["group_activities", "luxury"],
          habitatIds: ["city"],
        }),
        makePokemon({
          id: "mid",
          fullDisplayName: "Mid Match",
          favoriteCategoryIds: ["glass_stuff"],
          habitatIds: ["forest"],
        }),
        makePokemon({
          id: "low",
          fullDisplayName: "Low Match",
          favoriteCategoryIds: [],
          habitatIds: ["desert"],
        }),
      ],
      query: "",
    });
    const sections = groupPokemonPickerCandidates(ranked);

    expect(ranked.map((entry) => entry.entry.id)).toEqual(["top", "mid", "low"]);
    expect(sections.find((entry) => entry.id === "best")?.items.map((entry) => entry.entry.id)).toEqual(["top"]);
    expect(sections.find((entry) => entry.id === "good")?.items.map((entry) => entry.entry.id)).toEqual(["mid"]);
    expect(sections.find((entry) => entry.id === "challenging")?.items.map((entry) => entry.entry.id)).toEqual([
      "low",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { pokemonById } from "../data/pokemon";
import { getHabitatConflicts } from "../lib/compatibility";
import { scorePair } from "../lib/scoring/scorePair";
import { scoreTeam } from "../lib/scoring/scoreTeam";

const getPokemon = (...ids: string[]) => ids.map((id) => pokemonById.get(id)!);

describe("pair scoring", () => {
  it("rewards shared favorites and habitats", () => {
    const [pikachu, meowth] = getPokemon("pikachu", "meowth");
    const breakdown = scorePair(pikachu, meowth);
    expect(breakdown.sharedFavoriteCategoryIds).toEqual(["glass_stuff", "group_activities"]);
    expect(breakdown.matchingHabitatTraitIds).toEqual([]);
    expect(breakdown.score).toBe(16);
  });

  it("surfaces direct habitat conflicts", () => {
    const [pikachu, noctowl] = getPokemon("pikachu", "noctowl");
    const breakdown = scorePair(pikachu, noctowl);
    expect(breakdown.conflictingHabitatPairs).toEqual(
      expect.arrayContaining([{ traitAId: "bright", traitBId: "dark" }]),
    );
    expect(breakdown.score).toBeLessThan(5);
  });
});

describe("team scoring", () => {
  it("returns full-team overlap and recommendations", () => {
    const group = getPokemon("eevee", "meowth", "slowpoke");
    const breakdown = scoreTeam(group);
    expect(breakdown.sharedFavoriteCategoryIdsAny).toContain("soft_stuff");
    expect(breakdown.recommendedFavoriteCategoryIds[0]).toBe("soft_stuff");
    expect(breakdown.recommendedItemIds.length).toBeGreaterThan(0);
    expect(breakdown.explanation.length).toBeGreaterThan(0);
  });

  it("scales cleanly for a 5-Pokemon team", () => {
    const group = getPokemon("pikachu", "eevee", "oddish", "meowth", "vulpix");
    const breakdown = scoreTeam(group);
    expect(breakdown.teamPokemonIds).toHaveLength(5);
    expect(breakdown.pairBreakdowns).toHaveLength(10);
    expect(["excellent", "good", "mixed", "poor"]).toContain(breakdown.summaryLabel);
  });
});

describe("habitat conflicts", () => {
  it("collects team-level habitat conflicts", () => {
    const conflicts = getHabitatConflicts(getPokemon("pikachu", "noctowl", "slowpoke"));
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some((conflict) => conflict.traitAId === "bright" && conflict.traitBId === "dark")).toBe(true);
  });
});

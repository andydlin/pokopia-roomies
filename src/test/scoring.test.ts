import { describe, expect, it } from "vitest";
import { habitatById } from "../data/habitats";
import { pokemonById } from "../data/pokemon";
import { getHabitatConflicts } from "../lib/compatibility";
import { getBestHabitatsForTeam, getHabitatCoverageBreakdown, getRecommendedItemsForHabitat } from "../lib/data/selectors";
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
  it("returns full-team overlap and habitat-aware recommendations", () => {
    const group = getPokemon("eevee", "meowth", "slowpoke");
    const breakdown = scoreTeam(group);
    expect(breakdown.sharedFavoriteCategoryIdsAny).toContain("soft_stuff");
    expect(breakdown.selectedHabitatId).not.toBeNull();
    expect(breakdown.habitatCoverage?.stronglySupportedPokemonIds.length ?? 0).toBeGreaterThan(0);
    expect(breakdown.recommendedFavoriteCategoryIds.length).toBeGreaterThan(0);
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

describe("habitat-aware scoring", () => {
  it("finds useful habitats for a team", () => {
    const group = getPokemon("pikachu", "meowth");
    const best = getBestHabitatsForTeam(group);
    expect(best.length).toBeGreaterThan(0);
    expect(habitatById.get(best[0].habitatId)).toBeTruthy();
    expect(best[0].habitatFitItemIds.length).toBeGreaterThan(0);
  });

  it("reports habitat item coverage and recommended items", () => {
    const group = getPokemon("pikachu", "meowth");
    const habitatId = getBestHabitatsForTeam(group)[0].habitatId;
    const coverage = getHabitatCoverageBreakdown(group, habitatId);
    const recommendations = getRecommendedItemsForHabitat(group, habitatId);

    expect(coverage.stronglySupportedPokemonIds.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].habitatId).toBe(habitatId);
  });

  it("changes support and total score for the same team across habitats", () => {
    const group = getPokemon("pikachu", "meowth", "slowpoke");
    const rankedHabitats = getBestHabitatsForTeam(group);

    expect(rankedHabitats.length).toBeGreaterThan(1);

    const strongerHabitat = rankedHabitats[0].habitatId;
    const weakerHabitat = rankedHabitats[rankedHabitats.length - 1].habitatId;
    const strongerBreakdown = scoreTeam(group, { habitatId: strongerHabitat });
    const weakerBreakdown = scoreTeam(group, { habitatId: weakerHabitat });

    expect(strongerBreakdown.habitatSupportBonus).toBeGreaterThan(weakerBreakdown.habitatSupportBonus);
    expect(strongerBreakdown.totalScore).toBeGreaterThan(weakerBreakdown.totalScore);
    expect(strongerBreakdown.recommendedItemIds).not.toEqual(weakerBreakdown.recommendedItemIds);
  });
});

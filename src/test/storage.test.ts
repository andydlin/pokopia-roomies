import { describe, expect, it, beforeEach } from "vitest";
import { deleteSavedTeam, loadDraftTeamIds, loadSavedTeams, persistDraftTeamIds, upsertSavedTeam } from "../lib/storage";
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE, canSaveTeam } from "../lib/teams/teamHelpers";

describe("team constraints", () => {
  it("enforces saveable team size between 2 and 5", () => {
    expect(canSaveTeam([])).toBe(false);
    expect(canSaveTeam(["pikachu"])).toBe(false);
    expect(canSaveTeam(["pikachu", "eevee"])).toBe(true);
    expect(canSaveTeam(["a", "b", "c", "d", "e", "f"])).toBe(false);
    expect(MIN_TEAM_SIZE).toBe(2);
    expect(MAX_TEAM_SIZE).toBe(5);
  });
});

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists and reloads saved teams", () => {
    const saved = upsertSavedTeam(
      {
        id: "team-1",
        name: "Sun crew",
        pokemonIds: ["pikachu", "meowth"],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      [],
    );

    expect(saved).toHaveLength(1);
    expect(loadSavedTeams()[0].name).toBe("Sun crew");
    expect(deleteSavedTeam("team-1", loadSavedTeams())).toHaveLength(0);
  });

  it("persists draft team ids", () => {
    persistDraftTeamIds(["pikachu", "eevee"]);
    expect(loadDraftTeamIds()).toEqual(["pikachu", "eevee"]);
  });
});

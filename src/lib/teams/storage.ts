import type { SavedTeam } from "../types";

const SAVED_TEAMS_KEY = "pokopia-lab.saved-teams";
const DRAFT_TEAM_KEY = "pokopia-lab.draft-team";

export const loadSavedTeams = (): SavedTeam[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_TEAMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTeam[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistSavedTeams = (teams: SavedTeam[]) => {
  window.localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
};

export const upsertSavedTeam = (team: SavedTeam, currentTeams: SavedTeam[]) => {
  const existingIndex = currentTeams.findIndex((entry) => entry.id === team.id);
  const nextTeams =
    existingIndex === -1
      ? [team, ...currentTeams]
      : currentTeams.map((entry) => (entry.id === team.id ? team : entry));
  persistSavedTeams(nextTeams);
  return nextTeams;
};

export const deleteSavedTeam = (teamId: string, currentTeams: SavedTeam[]) => {
  const nextTeams = currentTeams.filter((entry) => entry.id !== teamId);
  persistSavedTeams(nextTeams);
  return nextTeams;
};

export const loadDraftTeamIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DRAFT_TEAM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistDraftTeamIds = (pokemonIds: string[]) => {
  window.localStorage.setItem(DRAFT_TEAM_KEY, JSON.stringify(pokemonIds));
};

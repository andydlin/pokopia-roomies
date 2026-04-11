import type { Team, TeamStorageIssue, TeamsStorageEnvelope } from "../../domain/types";
import {
  defaultTeamsStorageEnvelope,
  parseDraftPokemonIds,
  parseTeamsStorageEnvelope,
} from "../../domain/validation/teamStorage";

const STORAGE_KEY = "pokopia-lab.teams-storage";
const LEGACY_SAVED_TEAMS_KEY = "pokopia-lab.saved-teams";
const LEGACY_DRAFT_TEAM_KEY = "pokopia-lab.draft-team";

let lastTeamStorageIssues: TeamStorageIssue[] = [];

const canUseStorage = () => typeof window !== "undefined";

const persistEnvelope = (envelope: TeamsStorageEnvelope) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
};

const loadEnvelope = (): TeamsStorageEnvelope => {
  if (!canUseStorage()) {
    lastTeamStorageIssues = [];
    return defaultTeamsStorageEnvelope();
  }

  const { envelope, issues } = parseTeamsStorageEnvelope(window.localStorage.getItem(STORAGE_KEY));
  if (window.localStorage.getItem(STORAGE_KEY)) {
    lastTeamStorageIssues = issues;
    persistEnvelope(envelope);
    return envelope;
  }

  const legacyTeams = parseTeamsStorageEnvelope(window.localStorage.getItem(LEGACY_SAVED_TEAMS_KEY));
  const legacyDraft = parseDraftPokemonIds(window.localStorage.getItem(LEGACY_DRAFT_TEAM_KEY));

  const migratedEnvelope: TeamsStorageEnvelope = {
    version: 1,
    teams: legacyTeams.envelope.teams,
    draftPokemonIds: legacyDraft.draftPokemonIds,
  };

  lastTeamStorageIssues = [...issues, ...legacyTeams.issues, ...legacyDraft.issues];
  persistEnvelope(migratedEnvelope);
  return migratedEnvelope;
};

export const getLastTeamStorageIssues = () => [...lastTeamStorageIssues];

export const loadSavedTeams = (): Team[] => loadEnvelope().teams;

export const persistSavedTeams = (teams: Team[]) => {
  const current = loadEnvelope();
  persistEnvelope({
    ...current,
    teams,
  });
};

export const upsertSavedTeam = (team: Team, currentTeams: Team[]) => {
  const existingIndex = currentTeams.findIndex((entry) => entry.id === team.id);
  const nextTeams =
    existingIndex === -1
      ? [team, ...currentTeams]
      : currentTeams.map((entry) => (entry.id === team.id ? team : entry));
  persistSavedTeams(nextTeams);
  return nextTeams;
};

export const deleteSavedTeam = (teamId: string, currentTeams: Team[]) => {
  const nextTeams = currentTeams.filter((entry) => entry.id !== teamId);
  persistSavedTeams(nextTeams);
  return nextTeams;
};

export const loadDraftTeamIds = (): string[] => loadEnvelope().draftPokemonIds;

export const persistDraftTeamIds = (pokemonIds: string[]) => {
  const current = loadEnvelope();
  persistEnvelope({
    ...current,
    draftPokemonIds: pokemonIds,
  });
};

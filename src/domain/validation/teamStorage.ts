import type { Team, TeamStorageIssue, TeamsStorageEnvelope } from "../types";

const TEAM_STORAGE_VERSION = 1 as const;

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isValidTeam = (value: unknown): value is Team => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.name) &&
    isStringArray(candidate.pokemonIds) &&
    isNonEmptyString(candidate.createdAt) &&
    isNonEmptyString(candidate.updatedAt)
  );
};

export const defaultTeamsStorageEnvelope = (): TeamsStorageEnvelope => ({
  version: TEAM_STORAGE_VERSION,
  teams: [],
  draftPokemonIds: [],
});

export const parseTeamsStorageEnvelope = (
  rawEnvelope: string | null,
): { envelope: TeamsStorageEnvelope; issues: TeamStorageIssue[] } => {
  if (!rawEnvelope) {
    return { envelope: defaultTeamsStorageEnvelope(), issues: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawEnvelope);
  } catch {
    return {
      envelope: defaultTeamsStorageEnvelope(),
      issues: [{ code: "invalid_json", message: "Stored team data could not be parsed." }],
    };
  }

  if (Array.isArray(parsed)) {
    const teams = parsed.filter(isValidTeam);
    const issues =
      teams.length === parsed.length
        ? []
        : [{ code: "invalid_team" as const, message: "Some legacy saved teams were discarded because they were invalid." }];

    return {
      envelope: {
        version: TEAM_STORAGE_VERSION,
        teams,
        draftPokemonIds: [],
      },
      issues,
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      envelope: defaultTeamsStorageEnvelope(),
      issues: [{ code: "invalid_envelope", message: "Stored team data did not have the expected object shape." }],
    };
  }

  const candidate = parsed as Record<string, unknown>;
  if (candidate.version !== TEAM_STORAGE_VERSION) {
    return {
      envelope: defaultTeamsStorageEnvelope(),
      issues: [{ code: "invalid_version", message: `Unsupported team storage version "${String(candidate.version)}".` }],
    };
  }

  const issues: TeamStorageIssue[] = [];
  const teams = Array.isArray(candidate.teams) ? candidate.teams.filter(isValidTeam) : [];
  if (!Array.isArray(candidate.teams) || teams.length !== candidate.teams.length) {
    issues.push({ code: "invalid_team", message: "Some stored teams were invalid and were ignored." });
  }

  const draftPokemonIds = isStringArray(candidate.draftPokemonIds) ? candidate.draftPokemonIds : [];
  if (!isStringArray(candidate.draftPokemonIds)) {
    issues.push({ code: "invalid_draft", message: "Stored draft Pokemon ids were invalid and were reset." });
  }

  return {
    envelope: {
      version: TEAM_STORAGE_VERSION,
      teams,
      draftPokemonIds,
    },
    issues,
  };
};

export const parseDraftPokemonIds = (rawDraft: string | null): { draftPokemonIds: string[]; issues: TeamStorageIssue[] } => {
  if (!rawDraft) return { draftPokemonIds: [], issues: [] };

  try {
    const parsed = JSON.parse(rawDraft);
    if (isStringArray(parsed)) {
      return { draftPokemonIds: parsed, issues: [] };
    }
  } catch {
    return {
      draftPokemonIds: [],
      issues: [{ code: "invalid_json", message: "Stored draft team data could not be parsed." }],
    };
  }

  return {
    draftPokemonIds: [],
    issues: [{ code: "invalid_draft", message: "Stored draft team data had an invalid shape." }],
  };
};

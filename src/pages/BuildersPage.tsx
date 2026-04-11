import { useEffect, useMemo, useState } from "react";
import { loadDraftTeamIds, persistDraftTeamIds } from "../lib/storage";
import { MAX_TEAM_SIZE, resolveTeamMembers } from "../lib/teams/teamHelpers";
import { SectionCard } from "../components/common/SectionCard";
import { SelectedPokemonPanel } from "../components/pokemon/SelectedPokemonPanel";
import { TeamBuilder } from "../components/teams/TeamBuilder";

export const BuildersPage = () => {
  const [draftIds, setDraftIds] = useState<string[]>([]);

  useEffect(() => {
    setDraftIds(loadDraftTeamIds().slice(0, MAX_TEAM_SIZE));
  }, []);

  const teamResolution = useMemo(() => resolveTeamMembers(draftIds), [draftIds]);
  const members = teamResolution.members;
  const missingDraftPokemonIds = teamResolution.missingPokemonIds;

  const setNextDraftIds = (nextIds: string[]) => {
    setDraftIds(nextIds);
    persistDraftTeamIds(nextIds);
  };

  const addPokemon = (pokemonId: string) => {
    setNextDraftIds(
      draftIds.includes(pokemonId) || draftIds.length >= MAX_TEAM_SIZE ? draftIds : [...draftIds, pokemonId],
    );
  };

  const removePokemon = (pokemonId: string) => {
    setNextDraftIds(draftIds.filter((entry) => entry !== pokemonId));
  };

  return (
    <div className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      {/* Roomies.LeftColumn.BuilderShell */}
      <SectionCard
        eyebrow="Roomies"
        title="Build your group"
        description="Pick 1-5 Pokemon. Shared favorites drive the ranking, with habitat as context."
      >
        {/* Roomies.LeftColumn.CandidatePicker */}
        <TeamBuilder selected={members} onAdd={addPokemon} />
        {/* Roomies.LeftColumn.MissingPokemonNotice */}
        {missingDraftPokemonIds.length > 0 ? (
          <p className="type-body mt-3 text-berry/80">
            Missing Pokemon still referenced by this draft: {missingDraftPokemonIds.join(", ")}
          </p>
        ) : null}
      </SectionCard>

      <div className="space-y-6 lg:sticky lg:top-10 lg:self-start">
        {/* Roomies.RightSidebar.GroupPanel */}
        <SelectedPokemonPanel selected={members} onRemove={removePokemon} maxSize={MAX_TEAM_SIZE} />
      </div>
    </div>
  );
};

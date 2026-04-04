import { useEffect, useMemo, useState } from "react";
import { favoriteCategoryById } from "../data/favoriteCategories";
import { itemById } from "../data/items";
import { pokemonById } from "../data/pokemon";
import { scoreTeam } from "../lib/compatibility";
import { getRecommendedCategories, getRecommendedItems, getSharedFavoriteCategories, getSharedFavoriteCategoriesAny } from "../lib/favorites";
import { loadDraftTeamIds, loadSavedTeams, persistDraftTeamIds, upsertSavedTeam } from "../lib/storage";
import { getTeamMembers, MAX_TEAM_SIZE } from "../lib/teams/teamHelpers";
import type { SavedTeam } from "../lib/types";
import { SharedFavoritesCard } from "../components/items/SharedFavoritesCard";
import { ItemRecommendationCard, RecommendedCategoryCard } from "../components/items/ItemRecommendationCard";
import { SectionCard } from "../components/common/SectionCard";
import { ScoreBadge } from "../components/common/ScoreBadge";
import { TeamBuilder } from "../components/teams/TeamBuilder";

export const ItemsPage = () => {
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDraftIds(loadDraftTeamIds().slice(0, MAX_TEAM_SIZE));
    setSavedTeams(loadSavedTeams());
  }, []);

  const members = useMemo(() => getTeamMembers(draftIds), [draftIds]);
  const breakdown = useMemo(() => scoreTeam(members), [members]);
  const sharedAll = useMemo(() => getSharedFavoriteCategories(members), [members]);
  const sharedAny = useMemo(() => getSharedFavoriteCategoriesAny(members), [members]);
  const recommendedCategories = useMemo(() => getRecommendedCategories(members), [members]);
  const recommendedItems = useMemo(() => getRecommendedItems(members), [members]);

  const setNextDraftIds = (nextIds: string[]) => {
    setDraftIds(nextIds);
    persistDraftTeamIds(nextIds);
  };

  const addPokemon = (pokemonId: string) => {
    setStatus(null);
    setNextDraftIds(
      draftIds.includes(pokemonId) || draftIds.length >= MAX_TEAM_SIZE ? draftIds : [...draftIds, pokemonId],
    );
  };

  const removePokemon = (pokemonId: string) => {
    setStatus(null);
    setNextDraftIds(draftIds.filter((entry) => entry !== pokemonId));
  };

  const saveTeam = (name: string) => {
    const timestamp = new Date().toISOString();
    const team: SavedTeam = {
      id: crypto.randomUUID(),
      name,
      pokemonIds: draftIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextTeams = upsertSavedTeam(team, savedTeams);
    setSavedTeams(nextTeams);
    setStatus(`Saved ${name}.`);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard
        eyebrow="Item Optimizer"
        title="Build a 1–5 Pokemon draft and rank what helps it most"
        description="Shared favorites are the strongest signal, but the recommendations below also weigh item coverage and craftability."
      >
        <TeamBuilder selected={members} onAdd={addPokemon} onRemove={removePokemon} onSave={saveTeam} />
        {status ? <p className="mt-4 text-sm text-ink/65">{status}</p> : null}
      </SectionCard>

      <div className="space-y-6">
        <SectionCard eyebrow="Team Summary" title="Compatibility snapshot">
          {members.length < 2 ? (
            <p className="text-sm text-ink/65">Pick at least two Pokemon to unlock the full team score and comparison breakdown.</p>
          ) : (
            <div className="space-y-4">
              <ScoreBadge score={breakdown.totalScore} label={breakdown.summaryLabel} />
              <div className="grid gap-3 md:grid-cols-2">
                {breakdown.explanation.map((entry) => (
                  <div key={entry} className="rounded-[1.4rem] border border-white/70 bg-white/70 p-4 text-sm text-ink/72">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2">
          <SharedFavoritesCard
            title="Shared by all"
            helper="These categories overlap across everyone in the current draft."
            categoryIds={sharedAll}
          />
          <SharedFavoritesCard
            title="Shared by some"
            helper="These still create useful item overlap for at least two teammates."
            categoryIds={sharedAny}
          />
        </div>

        <SectionCard eyebrow="Recommended Categories" title="Best favorite categories for this draft">
          <div className="grid gap-4 md:grid-cols-2">
            {recommendedCategories.length === 0 ? (
              <p className="text-sm text-ink/60">Add at least one Pokemon to see category recommendations.</p>
            ) : (
              recommendedCategories.map((recommendation) => (
                <RecommendedCategoryCard key={recommendation.categoryId} recommendation={recommendation} teamSize={members.length} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Recommended Items" title="Concrete items with the best coverage">
          <div className="grid gap-4 md:grid-cols-2">
            {recommendedItems.length === 0 ? (
              <p className="text-sm text-ink/60">Add at least one Pokemon to see item recommendations.</p>
            ) : (
              recommendedItems.map((recommendation) => (
                <ItemRecommendationCard key={recommendation.itemId} recommendation={recommendation} teamSize={members.length} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

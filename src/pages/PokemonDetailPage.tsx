import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { favoriteCategoryById } from "../data/favoriteCategories";
import { habitatTraitById } from "../data/habitatTraits";
import { locationById } from "../data/locations";
import { pokemon, pokemonBySlug } from "../data/pokemon";
import { pokemonExplorerBySlug } from "../data/pokemonExplorer";
import { specialtyById } from "../data/specialties";
import { scorePair } from "../lib/compatibility";
import { getFavoriteItemsForPokemon, getHabitatConflicts } from "../lib/favorites";
import { getCompatibilityPotential, getRelatedPokemon } from "../lib/pokemonExplorer";
import { loadDraftTeamIds, persistDraftTeamIds } from "../lib/storage";
import { MAX_TEAM_SIZE } from "../lib/teams/teamHelpers";
import { Chip } from "../components/common/Chip";
import { EmptyState } from "../components/common/EmptyState";
import { SectionCard } from "../components/common/SectionCard";
import { PokemonCard } from "../components/pokemon/PokemonCard";
import { ExplorerPokemonCard } from "../components/pokemon/ExplorerPokemonCard";

export const PokemonDetailPage = () => {
  const { slug } = useParams();
  const entry = slug ? pokemonBySlug.get(slug) : null;
  const explorerEntry = slug ? pokemonExplorerBySlug.get(slug) : null;
  const [status, setStatus] = useState<string | null>(null);

  const teammates = useMemo(() => {
    if (!entry) return [];
    return pokemon
      .filter((candidate) => candidate.id !== entry.id)
      .map((candidate) => ({
        candidate,
        breakdown: scorePair(entry, candidate),
      }))
      .sort((left, right) => right.breakdown.score - left.breakdown.score);
  }, [entry]);
  const relatedPokemon = useMemo(
    () => (explorerEntry ? getRelatedPokemon(explorerEntry) : []),
    [explorerEntry],
  );

  if (!entry) {
    return <EmptyState title="Pokemon not found" body="Try opening the smart dex and selecting a Pokemon from there." />;
  }

  const favoriteItems = getFavoriteItemsForPokemon(entry);

  return (
    <div className="space-y-6">
      <SectionCard eyebrow="Pokemon Detail" title={entry.name} description="See the planning metadata that makes this Pokemon useful, then branch into related Pokemon or direct teammate suggestions.">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            {explorerEntry ? (
              <div className="flex flex-wrap gap-2">
                <Chip tone="accent">Potential {getCompatibilityPotential(explorerEntry)}</Chip>
                <Chip>#{explorerEntry.number}</Chip>
                <Chip tone="warning">{explorerEntry.idealHabitat}</Chip>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {entry.favoriteCategoryIds.map((categoryId) => (
                <Chip key={categoryId}>{favoriteCategoryById.get(categoryId)?.name ?? categoryId}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.idealHabitatTraitIds.map((traitId) => (
                <Chip key={traitId} tone="warning">
                  {habitatTraitById.get(traitId)?.label ?? traitId}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-ink/68">Specialty: {specialtyById.get(entry.specialtyId)?.name ?? entry.specialtyId}</p>
            <p className="text-sm text-ink/68">
              Locations: {entry.locationIds.map((locationId) => locationById.get(locationId)?.name ?? locationId).join(", ")}
            </p>
            <div className="flex flex-wrap gap-2">
              {favoriteItems.map((item) => (
                <Chip key={item.id} tone="accent">
                  {item.name}
                </Chip>
              ))}
            </div>
            {explorerEntry?.favoriteItemCategories?.length ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink/75">Favorite item categories</p>
                <div className="flex flex-wrap gap-2">
                  {explorerEntry.favoriteItemCategories.map((category) => (
                    <Chip key={category}>{category}</Chip>
                  ))}
                </div>
              </div>
            ) : null}
            {explorerEntry?.notes ? <p className="text-sm leading-6 text-ink/68">{explorerEntry.notes}</p> : null}
          </div>
          {entry.imageUrl ? <img src={entry.imageUrl} alt={entry.name} className="h-32 w-32 object-contain" /> : null}
        </div>
      </SectionCard>

      {status ? <p className="text-sm text-ink/65">{status}</p> : null}

      {relatedPokemon.length > 0 ? (
        <SectionCard eyebrow="Related Pokemon" title={`Other useful planning matches for ${entry.name}`}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {relatedPokemon.map((result) => (
              <ExplorerPokemonCard key={result.entry.id} result={result} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Ranked Teammates" title={`Best teammate candidates for ${entry.name}`}>
        <div className="grid gap-4 lg:grid-cols-2">
          {teammates.map(({ candidate, breakdown }) => {
            const habitatConflicts = getHabitatConflicts([entry, candidate]);
            return (
              <div key={candidate.id} className="space-y-3 rounded-[1.8rem] border border-white/70 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <PokemonCard pokemon={candidate} />
                  <div className="min-w-28 rounded-[1.2rem] bg-moss/10 px-3 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-moss/70">Pair score</p>
                    <p className="text-2xl font-semibold text-ink">{breakdown.score}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {breakdown.sharedFavoriteCategoryIds.map((categoryId) => (
                    <Chip key={categoryId} tone="accent">
                      {favoriteCategoryById.get(categoryId)?.name ?? categoryId}
                    </Chip>
                  ))}
                  {breakdown.matchingHabitatTraitIds.map((traitId) => (
                    <Chip key={traitId}>{habitatTraitById.get(traitId)?.label ?? traitId}</Chip>
                  ))}
                  {habitatConflicts.map((conflict: { traitAId: string; traitBId: string }) => (
                    <Chip key={`${conflict.traitAId}-${conflict.traitBId}`} tone="warning">
                      Conflict: {habitatTraitById.get(conflict.traitAId)?.label} vs {habitatTraitById.get(conflict.traitBId)?.label}
                    </Chip>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = loadDraftTeamIds();
                    const next = [entry.id, candidate.id, ...current.filter((pokemonId) => pokemonId !== entry.id && pokemonId !== candidate.id)].slice(0, MAX_TEAM_SIZE);
                    persistDraftTeamIds(next);
                    setStatus(`Added ${entry.name} and ${candidate.name} to the draft team.`);
                  }}
                  className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-paper"
                >
                  Add to draft
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <Link to="/items" className="inline-flex rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-sm font-semibold text-ink">
        Open Item Optimizer with draft
      </Link>
    </div>
  );
};

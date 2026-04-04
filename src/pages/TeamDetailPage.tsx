import { Link, useParams } from "react-router-dom";
import { favoriteCategoryById } from "../data/favoriteCategories";
import { habitatTraitById } from "../data/habitatTraits";
import { itemById } from "../data/items";
import { loadSavedTeams } from "../lib/storage";
import { scoreTeam } from "../lib/compatibility";
import { getTeamMembers } from "../lib/teams/teamHelpers";
import { Chip } from "../components/common/Chip";
import { EmptyState } from "../components/common/EmptyState";
import { ScoreBadge } from "../components/common/ScoreBadge";
import { SectionCard } from "../components/common/SectionCard";

export const TeamDetailPage = () => {
  const { id } = useParams();
  const team = loadSavedTeams().find((entry) => entry.id === id);

  if (!team) {
    return <EmptyState title="Team not found" body="This saved team may have been deleted from local storage." />;
  }

  const members = getTeamMembers(team.pokemonIds);
  const breakdown = scoreTeam(members);

  return (
    <div className="space-y-6">
      <SectionCard eyebrow="Team Detail" title={team.name}>
        <div className="flex flex-wrap items-center gap-3">
          <ScoreBadge score={breakdown.totalScore} label={breakdown.summaryLabel} />
          {members.map((member) => (
            <Chip key={member.id}>{member.name}</Chip>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard eyebrow="Overlap" title="Shared favorites and habitat">
          <div className="space-y-4 text-sm text-ink/70">
            <p>
              Shared favorites across all:{" "}
              {breakdown.sharedFavoriteCategoryIdsAll.length > 0
                ? breakdown.sharedFavoriteCategoryIdsAll
                    .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId)
                    .join(", ")
                : "None"}
            </p>
            <p>
              Shared favorites across at least two:{" "}
              {breakdown.sharedFavoriteCategoryIdsAny.length > 0
                ? breakdown.sharedFavoriteCategoryIdsAny
                    .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId)
                    .join(", ")
                : "None"}
            </p>
            <p>
              Shared habitat traits across all:{" "}
              {breakdown.matchingHabitatTraitIdsAll.length > 0
                ? breakdown.matchingHabitatTraitIdsAll
                    .map((traitId) => habitatTraitById.get(traitId)?.label ?? traitId)
                    .join(", ")
                : "None"}
            </p>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Conflicts" title="Habitat friction to watch">
          <div className="space-y-3">
            {breakdown.conflictingHabitatPairs.length === 0 ? (
              <p className="text-sm text-ink/65">No direct opposite habitat traits in this team.</p>
            ) : (
              breakdown.conflictingHabitatPairs.map((conflict) => (
                <p key={`${conflict.pokemonAId}-${conflict.pokemonBId}-${conflict.traitAId}`} className="text-sm text-ink/70">
                  {conflict.pokemonAId} wants {habitatTraitById.get(conflict.traitAId)?.label} while {conflict.pokemonBId} wants {habitatTraitById.get(conflict.traitBId)?.label}.
                </p>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard eyebrow="Recommendations" title="Best categories and items">
        <div className="space-y-3 text-sm text-ink/70">
          <p>
            Categories:{" "}
            {breakdown.recommendedFavoriteCategoryIds
              .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId)
              .join(", ")}
          </p>
          <p>
            Items: {breakdown.recommendedItemIds.map((itemId) => itemById.get(itemId)?.name ?? itemId).join(", ")}
          </p>
        </div>
      </SectionCard>

      <Link
        to={`/compare?left=${team.id}`}
        className="inline-flex rounded-full bg-moss px-4 py-2 text-sm font-semibold text-paper"
      >
        Compare this team
      </Link>
    </div>
  );
};

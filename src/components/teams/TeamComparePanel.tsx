import { favoriteCategoryById } from "../../data/favoriteCategories";
import { itemById } from "../../data/items";
import { pokemonById } from "../../data/pokemon";
import type { SavedTeam } from "../../lib/types";
import { scoreTeam } from "../../lib/compatibility";
import { getTeamMembers } from "../../lib/teams/teamHelpers";
import { getTeamStyleSummary } from "../../lib/data/selectors";
import { Chip } from "../common/Chip";
import { ScoreBadge } from "../common/ScoreBadge";

export const TeamComparePanel = ({ team }: { team: SavedTeam }) => {
  const members = getTeamMembers(team.pokemonIds);
  const breakdown = scoreTeam(members);
  const style = getTeamStyleSummary(members);

  return (
    <div className="card-shell rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">{team.name}</h2>
          <p className="mt-1 text-sm text-ink/60">{style.label}</p>
        </div>
        <ScoreBadge score={breakdown.totalScore} label={breakdown.summaryLabel} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {members.map((member) => (
          <Chip key={member.id}>{pokemonById.get(member.id)?.name ?? member.id}</Chip>
        ))}
      </div>

      <div className="mt-4 space-y-3 text-sm text-ink/70">
        <p>{style.description}</p>
        <p>
          Shared favorites:{" "}
          {breakdown.sharedFavoriteCategoryIdsAny.length > 0
            ? breakdown.sharedFavoriteCategoryIdsAny
                .map((categoryId) => favoriteCategoryById.get(categoryId)?.name ?? categoryId)
                .join(", ")
            : "None"}
        </p>
        <p>
          Recommended items:{" "}
          {breakdown.recommendedItemIds.slice(0, 3).length > 0
            ? breakdown.recommendedItemIds
                .slice(0, 3)
                .map((itemId) => itemById.get(itemId)?.name ?? itemId)
                .join(", ")
            : "None"}
        </p>
        <p>Habitat conflicts: {breakdown.conflictingHabitatPairs.length}</p>
      </div>
    </div>
  );
};

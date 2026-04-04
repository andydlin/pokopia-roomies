import { Link } from "react-router-dom";
import { pokemonById } from "../../data/pokemon";
import { scoreTeam } from "../../lib/compatibility";
import type { SavedTeam } from "../../lib/types";
import { getTeamMembers } from "../../lib/teams/teamHelpers";
import { Chip } from "../common/Chip";
import { ScoreBadge } from "../common/ScoreBadge";

export const TeamCard = ({ team }: { team: SavedTeam }) => {
  const members = getTeamMembers(team.pokemonIds);
  const breakdown = scoreTeam(members);

  return (
    <article className="card-shell rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to={`/teams/${team.id}`} className="text-2xl font-semibold text-ink hover:text-moss">
            {team.name}
          </Link>
          <p className="mt-1 text-sm text-ink/60">Updated {new Date(team.updatedAt).toLocaleDateString()}</p>
        </div>
        <ScoreBadge score={breakdown.totalScore} label={breakdown.summaryLabel} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {members.map((entry) => (
          <Chip key={entry.id}>{pokemonById.get(entry.id)?.name ?? entry.id}</Chip>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {breakdown.sharedFavoriteCategoryIdsAny.slice(0, 4).map((categoryId) => (
          <Chip key={categoryId} tone="accent">
            {categoryId}
          </Chip>
        ))}
      </div>
    </article>
  );
};

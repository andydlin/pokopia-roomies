import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { loadSavedTeams } from "../lib/storage";
import { EmptyState } from "../components/common/EmptyState";
import { SectionCard } from "../components/common/SectionCard";
import { TeamComparePanel } from "../components/teams/TeamComparePanel";

export const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const teams = loadSavedTeams();
  const leftId = searchParams.get("left") ?? teams[0]?.id ?? "";
  const rightId = searchParams.get("right") ?? teams[1]?.id ?? "";

  const leftTeam = useMemo(() => teams.find((team) => team.id === leftId), [leftId, teams]);
  const rightTeam = useMemo(() => teams.find((team) => team.id === rightId), [rightId, teams]);

  if (teams.length < 2) {
    return <EmptyState title="Need two saved teams" body="Save at least two teams before using the side-by-side compare view." />;
  }

  return (
    <div className="space-y-6">
      <SectionCard eyebrow="Compare" title="See two team ideas side by side">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={leftId}
            onChange={(event) => setSearchParams({ left: event.target.value, right: rightId })}
            className="type-ui rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            value={rightId}
            onChange={(event) => setSearchParams({ left: leftId, right: event.target.value })}
            className="type-ui rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {leftTeam ? <TeamComparePanel team={leftTeam} /> : null}
        {rightTeam ? <TeamComparePanel team={rightTeam} /> : null}
      </div>
    </div>
  );
};

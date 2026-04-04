import { useEffect, useState } from "react";
import { deleteSavedTeam, loadSavedTeams } from "../lib/storage";
import type { SavedTeam } from "../lib/types";
import { EmptyState } from "../components/common/EmptyState";
import { SectionCard } from "../components/common/SectionCard";
import { TeamCard } from "../components/teams/TeamCard";

export const TeamsPage = () => {
  const [teams, setTeams] = useState<SavedTeam[]>([]);

  useEffect(() => {
    setTeams(loadSavedTeams());
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard eyebrow="Saved Teams" title="Keep your best setups nearby" description="Teams are stored locally in your browser so you can revisit and compare planning ideas without rebuilding them.">
        {teams.length === 0 ? (
          <EmptyState title="No saved teams" body="Build a draft in the Item Optimizer and save it when you want to compare it later." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className="space-y-3">
                <TeamCard team={team} />
                <button
                  type="button"
                  onClick={() => setTeams(deleteSavedTeam(team.id, teams))}
                  className="rounded-full border border-berry/20 bg-berry/10 px-4 py-2 text-sm font-semibold text-berry"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

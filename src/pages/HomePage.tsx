import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadSavedTeams } from "../lib/storage";
import type { SavedTeam } from "../lib/types";
import { EmptyState } from "../components/common/EmptyState";
import { SectionCard } from "../components/common/SectionCard";
import { TeamCard } from "../components/teams/TeamCard";

const toolCards = [
  { title: "Roomies", body: "Find the best Pokemon matches for your group.", href: "/builder" },
  { title: "Reverse Lookup", body: "Start from an item, habitat, or specialty.", href: "/lookup" },
  { title: "Compatibility Explorer", body: "See who pairs best with a Pokemon.", href: "/pokemon/pikachu" },
  { title: "Saved Teams", body: "Save and compare your best setups.", href: "/teams" },
];

export const HomePage = () => {
  const [recentTeams, setRecentTeams] = useState<SavedTeam[]>([]);

  useEffect(() => {
    setRecentTeams(loadSavedTeams().slice(0, 2));
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Dashboard"
        title="Four tools, one planning loop"
        description="Use Roomies to build a group, reverse lookup when you start from constraints, inspect teammate suggestions from a Pokemon page, and save the teams worth comparing."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {toolCards.map((card) => (
            <Link key={card.title} to={card.href} className="rounded-[1.8rem] border border-white/70 bg-white/70 p-5 transition hover:border-moss">
              <h3 className="type-h3 text-ink">{card.title}</h3>
              <p className="type-body mt-2 text-ink/65">{card.body}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      {recentTeams.length === 0 ? (
        <EmptyState
          title="No saved teams yet"
          body="Start in Roomies, build a team of 2-6 Pokemon, and save it here for future comparisons."
          action={
            <Link to="/builder" className="type-ui type-ui-strong rounded-full bg-moss px-4 py-2 text-paper">
              Open Roomies
            </Link>
          }
        />
      ) : (
        <SectionCard eyebrow="Recent Teams" title="Pick up where you left off">
          <div className="grid gap-4 lg:grid-cols-2">
            {recentTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

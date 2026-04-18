import { useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { SectionCard } from "../components/common/SectionCard";
import { habitats } from "../data/habitats";

export const HabitatsPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const filteredHabitats = useMemo(
    () =>
      habitats.filter((habitat) => {
        if (!query) return true;
        return [habitat.name, habitat.slug, habitat.description ?? ""].join(" ").toLowerCase().includes(query.toLowerCase());
      }),
    [query],
  );

  const updateQuery = (nextQuery: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextQuery.trim().length === 0) {
      next.delete("q");
    } else {
      next.set("q", nextQuery);
    }
    setSearchParams(next, { replace: true });
  };

  const fromPath = `/habitats${location.search}`;

  return (
    <div className="space-y-6">
      <SectionCard eyebrow="Habitats" title={`All habitats (${habitats.length})`} description="Browse habitat requirements and required items in one place.">
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search habitats"
          className="type-ui w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
        />
      </SectionCard>

      <SectionCard eyebrow="Results" title={`${filteredHabitats.length} habitats`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredHabitats.map((habitat) => (
            <Link
              key={habitat.id}
              to={{ pathname: `/habitats/${habitat.id}`, search: `?from=${encodeURIComponent(fromPath)}` }}
              state={{ backgroundLocation: location, modal: true }}
              className="card-shell block rounded-[1.6rem] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="type-h3 text-ink">{habitat.name}</h3>
                  <p className="type-caption text-ink/60">#{habitat.number}</p>
                </div>
                {habitat.imageUrl ? (
                  <img src={habitat.imageUrl} alt={habitat.name} className="h-16 w-16 rounded-xl bg-white object-cover" />
                ) : null}
              </div>

              {habitat.description ? <p className="type-caption mt-2 text-ink/70">{habitat.description}</p> : null}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

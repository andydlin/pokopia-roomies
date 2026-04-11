import { useMemo, useState } from "react";
import { explorerFavoriteNames, explorerIdealHabitats, explorerSpecialties, pokemonExplorerEntries } from "../data/pokemonExplorer";
import { explorerDefaultFilters, filterExplorerEntries, getCompatibilityPotential, getExplorerFilterOptions, sortExplorerEntries } from "../lib/pokemonExplorer";
import type { ExplorerSortOption } from "../lib/types";
import { Chip } from "../components/common/Chip";
import { EmptyState } from "../components/common/EmptyState";
import { SectionCard } from "../components/common/SectionCard";
import { ExplorerFiltersPanel } from "../components/pokemon/ExplorerFiltersPanel";
import { ExplorerPokemonCard } from "../components/pokemon/ExplorerPokemonCard";

export const DexPage = () => {
  const [filters, setFilters] = useState(explorerDefaultFilters);
  const [sort, setSort] = useState<ExplorerSortOption>("compatibility-potential-desc");

  const filteredEntries = useMemo(
    () => filterExplorerEntries(pokemonExplorerEntries, filters),
    [filters],
  );
  const results = useMemo(() => sortExplorerEntries(filteredEntries, sort), [filteredEntries, sort]);
  const favoriteOptions = useMemo(
    () =>
      getExplorerFilterOptions(pokemonExplorerEntries, (entry) => entry.favorites).filter((option) =>
        explorerFavoriteNames.includes(option.value),
      ),
    [],
  );
  const habitatOptions = useMemo(
    () =>
      getExplorerFilterOptions(pokemonExplorerEntries, (entry) => [entry.idealHabitat]).filter((option) =>
        explorerIdealHabitats.includes(option.value),
      ),
    [],
  );
  const specialtyOptions = useMemo(
    () =>
      getExplorerFilterOptions(pokemonExplorerEntries, (entry) => entry.specialties).filter((option) =>
        explorerSpecialties.includes(option.value),
      ),
    [],
  );

  const activeFilters = [
    ...filters.favorites.map((value) => ({ type: "favorites" as const, value })),
    ...filters.idealHabitats.map((value) => ({ type: "idealHabitats" as const, value })),
    ...filters.specialties.map((value) => ({ type: "specialties" as const, value })),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <SectionCard
          eyebrow="Advanced Explorer"
          title="Search, filter, and sort the full Pokemon catalog"
          description="Use multi-select filters and the compatibility-potential heuristic to scan the roster faster than a static database page."
        >
          <ExplorerFiltersPanel
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            favoriteOptions={favoriteOptions}
            habitatOptions={habitatOptions}
            specialtyOptions={specialtyOptions}
          />
        </SectionCard>
      </aside>

      <div className="space-y-6">
        <SectionCard eyebrow="Results" title={`${results.length} Pokemon matched`}>
          <div className="flex flex-wrap items-center gap-2">
            {filters.query ? (
              <Chip tone="accent">Search: {filters.query}</Chip>
            ) : null}
            {activeFilters.map((filter) => (
              <button
                key={`${filter.type}-${filter.value}`}
                type="button"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    [filter.type]: current[filter.type].filter((entry) => entry !== filter.value),
                  }))
                }
              >
                <Chip>{filter.value} ×</Chip>
              </button>
            ))}
            {filters.query || activeFilters.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setFilters(explorerDefaultFilters)}
                  className="type-ui type-ui-strong rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-ink"
                >
                  Clear all
                </button>
            ) : null}
          </div>
        </SectionCard>

        {results.length === 0 ? (
          <EmptyState
            title="No Pokemon matched"
            body="Try clearing one or two filters, or switch back to compatibility potential sorting to explore broader options."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((result) => (
              <ExplorerPokemonCard key={result.entry.id} result={result} />
            ))}
          </div>
        )}

        <SectionCard eyebrow="Why this sort helps" title="Compatibility potential is a broad planning signal">
          <p className="type-body text-ink/68">
            This heuristic adds points for more favorites, more specialties, common habitats, and favorite overlap with the wider dataset.
            For example, the current top match scores {getCompatibilityPotential(results[0]?.entry ?? pokemonExplorerEntries[0])} in this seed roster.
          </p>
        </SectionCard>
      </div>
    </div>
  );
};

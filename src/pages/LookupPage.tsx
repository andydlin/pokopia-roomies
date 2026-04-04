import { useMemo, useState } from "react";
import { pokemonById } from "../data/pokemon";
import { findPokemonMatches } from "../lib/data/selectors";
import type { LookupFilters as LookupFiltersState } from "../lib/types";
import { EmptyState } from "../components/common/EmptyState";
import { SectionCard } from "../components/common/SectionCard";
import { LookupFilters } from "../components/lookup/LookupFilters";
import { LookupResultsGrid } from "../components/lookup/LookupResultsGrid";

const defaultFilters: LookupFiltersState = {
  query: "",
  favoriteCategoryId: "all",
  itemId: "all",
  habitatTraitId: "all",
  specialtyId: "all",
};

export const LookupPage = () => {
  const [filters, setFilters] = useState<LookupFiltersState>(defaultFilters);
  const matches = useMemo(() => findPokemonMatches(filters), [filters]);
  const uniquePokemonCount = useMemo(
    () =>
      new Set(
        matches.map((match) => {
          const entry = pokemonById.get(match.pokemonId);
          return entry?.dexNumber ?? match.pokemonId;
        }),
      ).size,
    [matches],
  );
  const resultsTitle = `${uniquePokemonCount} Pokemon matched`;

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Reverse Lookup"
        title="Start from a constraint instead of a Pokemon"
        description="Combine category, item, habitat trait, and specialty filters to find candidates that fit the plan you already have in mind."
      >
        <LookupFilters filters={filters} onChange={setFilters} />
      </SectionCard>

      {matches.length === 0 ? (
        <EmptyState title="No matches yet" body="Try loosening one filter or switching from an exact item to its broader favorite category." />
      ) : (
        <SectionCard eyebrow="Results" title={resultsTitle}>
          <LookupResultsGrid matches={matches} />
        </SectionCard>
      )}
    </div>
  );
};

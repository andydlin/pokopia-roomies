import { useMemo, useState } from "react";
import { habitatTraitById } from "../../data/habitatTraits";
import { pokemon } from "../../data/pokemon";
import type { Pokemon } from "../../lib/types";
import { groupPokemonPickerCandidates, rankPokemonPickerCandidates } from "../../lib/teams/pickerRanking";
import { BuilderCandidateCard } from "./BuilderCandidateCard";

interface PokemonPickerProps {
  selected: Pokemon[];
  onAdd: (pokemonId: string) => void;
  maxSize: number;
}

export const PokemonPicker = ({ selected, onAdd, maxSize }: PokemonPickerProps) => {
  const [query, setQuery] = useState("");
  const selectedIds = useMemo(() => new Set(selected.map((entry) => entry.id)), [selected]);
  const getIdealHabitatLabel = (entry: Pokemon) =>
    entry.idealHabitatTraitIds.length === 0
      ? "None listed"
      : entry.idealHabitatTraitIds
          .map((traitId) => habitatTraitById.get(traitId)?.label ?? traitId)
          .join(", ");
  const getPrimaryHabitatLabel = (entry: Pokemon) =>
    entry.idealHabitatTraitIds.length === 0
      ? "Mixed"
      : (habitatTraitById.get(entry.idealHabitatTraitIds[0])?.label ?? entry.idealHabitatTraitIds[0]);
  const rankedCandidates = useMemo(
    () =>
      rankPokemonPickerCandidates({
        selected,
        available: pokemon.filter((entry) => !selectedIds.has(entry.id)),
        query,
      }),
    [query, selected, selectedIds],
  );
  const groupedCandidates = useMemo(
    () => groupPokemonPickerCandidates(rankedCandidates),
    [rankedCandidates],
  );
  const shouldShowSections = selected.length > 0;

  return (
    <div className="space-y-4">
      {/* Roomies.CandidatePicker.SearchInput */}
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Pokemon"
        className="type-ui w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
      />

      {/* Roomies.CandidatePicker.CandidateCardGrid */}
      {shouldShowSections
        ? groupedCandidates.map((section) =>
            section.items.length > 0 ? (
              <section key={section.id} className="space-y-3">
                <h3 className="type-overline px-1 text-ink/55">{section.title}</h3>
                <div className="grid justify-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,370px))]">
                  {section.items.map(({ entry, sharedFavoriteCategoryIds, sharedHabitatIds }) => {
                    return (
                      <BuilderCandidateCard
                        key={entry.id}
                        disabled={selected.length >= maxSize}
                        onAdd={onAdd}
                        entry={entry}
                        primaryHabitatLabel={getPrimaryHabitatLabel(entry)}
                        idealHabitatLabel={getIdealHabitatLabel(entry)}
                        sharedFavoriteCategoryIds={sharedFavoriteCategoryIds}
                        sharedHabitatIds={sharedHabitatIds}
                        compactVisual
                      />
                    );
                  })}
                </div>
              </section>
            ) : null,
          )
        : (
            <div className="grid justify-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,320px))]">
              {rankedCandidates.map(({ entry }) => {
                return (
                  <BuilderCandidateCard
                    key={entry.id}
                    disabled={selected.length >= maxSize}
                    onAdd={onAdd}
                    entry={entry}
                    primaryHabitatLabel={getPrimaryHabitatLabel(entry)}
                    idealHabitatLabel={getIdealHabitatLabel(entry)}
                    compactVisual={false}
                  />
                );
              })}
            </div>
          )}
    </div>
  );
};

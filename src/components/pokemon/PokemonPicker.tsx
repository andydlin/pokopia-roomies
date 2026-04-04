import { useMemo, useState } from "react";
import { pokemon } from "../../data/pokemon";
import type { Pokemon } from "../../lib/types";
import { Chip } from "../common/Chip";

interface PokemonPickerProps {
  selected: Pokemon[];
  onAdd: (pokemonId: string) => void;
  onRemove: (pokemonId: string) => void;
  maxSize: number;
}

export const PokemonPicker = ({ selected, onAdd, onRemove, maxSize }: PokemonPickerProps) => {
  const [query, setQuery] = useState("");
  const selectedIds = new Set(selected.map((entry) => entry.id));
  const filteredPokemon = useMemo(
    () => pokemon.filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Pokemon"
        className="w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-moss"
      />

      <div className="flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <p className="text-sm text-ink/60">No Pokemon selected yet.</p>
        ) : (
          selected.map((entry) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => onRemove(entry.id)}
              className="rounded-full border border-moss/15 bg-moss/10 px-3 py-1.5 text-sm font-semibold text-ink"
            >
              {entry.dexNumber ? `#${String(entry.dexNumber).padStart(3, "0")} ${entry.name}` : entry.name} ×
            </button>
          ))
        )}
      </div>

      <p className="text-sm text-ink/65">{selected.length}/{maxSize} selected</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {filteredPokemon.map((entry) => (
          <button
            key={entry.id}
            type="button"
            disabled={selectedIds.has(entry.id) || selected.length >= maxSize}
            onClick={() => onAdd(entry.id)}
            className="flex items-center justify-between rounded-[1.4rem] border border-white/70 bg-white/75 px-4 py-3 text-left transition hover:border-moss disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div>
              <p className="font-semibold text-ink">
                {entry.dexNumber ? `#${String(entry.dexNumber).padStart(3, "0")} ${entry.name}` : entry.name}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {entry.favoriteCategoryIds.slice(0, 2).map((categoryId) => (
                  <Chip key={categoryId}>{categoryId}</Chip>
                ))}
              </div>
            </div>
            {entry.imageUrl ? <img src={entry.imageUrl} alt="" className="h-12 w-12 object-contain" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
};

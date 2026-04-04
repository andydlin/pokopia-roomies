import { useMemo, useState } from "react";
import type { Pokemon } from "../../lib/types";
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from "../../lib/teams/teamHelpers";
import { PokemonPicker } from "../pokemon/PokemonPicker";

interface TeamBuilderProps {
  selected: Pokemon[];
  onAdd: (pokemonId: string) => void;
  onRemove: (pokemonId: string) => void;
  onSave: (name: string) => void;
}

export const TeamBuilder = ({ selected, onAdd, onRemove, onSave }: TeamBuilderProps) => {
  const [name, setName] = useState("");
  const helper = useMemo(() => {
    if (selected.length < MIN_TEAM_SIZE) return `Teams need ${MIN_TEAM_SIZE}-${MAX_TEAM_SIZE} Pokemon to save.`;
    return "Save this draft into your local team library.";
  }, [selected.length]);

  return (
    <div className="space-y-4">
      <PokemonPicker selected={selected} onAdd={onAdd} onRemove={onRemove} maxSize={MAX_TEAM_SIZE} />
      <div className="rounded-[1.6rem] border border-white/70 bg-white/70 p-4">
        <label className="block text-sm font-semibold text-ink">
          Team name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Sunny support core"
            className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-moss"
          />
        </label>
        <p className="mt-2 text-sm text-ink/60">{helper}</p>
        <button
          type="button"
          disabled={selected.length < MIN_TEAM_SIZE || selected.length > MAX_TEAM_SIZE || name.trim().length === 0}
          onClick={() => {
            onSave(name.trim());
            setName("");
          }}
          className="mt-4 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save team
        </button>
      </div>
    </div>
  );
};

import type { Pokemon } from "../../lib/types";
import { MAX_TEAM_SIZE } from "../../lib/teams/teamHelpers";
import { PokemonPicker } from "../pokemon/PokemonPicker";

interface TeamBuilderProps {
  selected: Pokemon[];
  onAdd: (pokemonId: string) => void;
}

export const TeamBuilder = ({ selected, onAdd }: TeamBuilderProps) => (
  <div className="space-y-4">
    {/* Roomies.CandidatePicker.SearchAndCards */}
    <PokemonPicker selected={selected} onAdd={onAdd} maxSize={MAX_TEAM_SIZE} />
  </div>
);

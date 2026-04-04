import { pokemonById } from "../../data/pokemon";
import type { LookupMatch } from "../../lib/types";
import { PokemonCard } from "../pokemon/PokemonCard";

export const LookupResultsGrid = ({ matches }: { matches: LookupMatch[] }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {matches.map((match) => {
      const entry = pokemonById.get(match.pokemonId);
      if (!entry) return null;
      return <PokemonCard key={entry.id} pokemon={entry} reasons={match.reasons} />;
    })}
  </div>
);

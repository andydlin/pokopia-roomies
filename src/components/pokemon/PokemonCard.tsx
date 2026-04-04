import { Link } from "react-router-dom";
import { favoriteCategoryById } from "../../data/favoriteCategories";
import { habitatTraitById } from "../../data/habitatTraits";
import { specialtyById } from "../../data/specialties";
import type { Pokemon } from "../../lib/types";
import { Chip } from "../common/Chip";

interface PokemonCardProps {
  pokemon: Pokemon;
  actionLabel?: string;
  onAction?: (pokemonId: string) => void;
  disabled?: boolean;
  reasons?: string[];
}

export const PokemonCard = ({ pokemon, actionLabel, onAction, disabled, reasons }: PokemonCardProps) => (
  <article className="card-shell rounded-[1.8rem] p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <Link to={`/pokemon/${pokemon.slug}`} className="text-xl font-semibold text-ink hover:text-moss">
          {pokemon.dexNumber ? `#${String(pokemon.dexNumber).padStart(3, "0")} ${pokemon.name}` : pokemon.name}
        </Link>
        <p className="text-sm text-ink/62">{specialtyById.get(pokemon.specialtyId)?.name}</p>
      </div>
      {pokemon.imageUrl ? <img src={pokemon.imageUrl} alt={pokemon.name} className="h-20 w-20 object-contain" /> : null}
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {pokemon.favoriteCategoryIds.map((categoryId) => (
        <Chip key={categoryId}>{favoriteCategoryById.get(categoryId)?.name ?? categoryId}</Chip>
      ))}
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      {pokemon.idealHabitatTraitIds.map((traitId) => (
        <Chip key={traitId} tone="warning">
          {habitatTraitById.get(traitId)?.label ?? traitId}
        </Chip>
      ))}
    </div>

    {reasons?.length ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {reasons.map((reason) => (
          <Chip key={reason} tone="accent">
            {reason}
          </Chip>
        ))}
      </div>
    ) : null}

    {actionLabel && onAction ? (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction(pokemon.id)}
        className="mt-4 rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        {actionLabel}
      </button>
    ) : null}
  </article>
);

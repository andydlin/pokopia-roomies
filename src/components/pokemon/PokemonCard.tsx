import { Link } from "react-router-dom";
import { favoriteCategoryById } from "../../data/favoriteCategories";
import { habitatTraitById } from "../../data/habitatTraits";
import { specialtyById } from "../../data/specialties";
import type { Pokemon } from "../../lib/types";
import { getPokemonTypeTheme } from "../../lib/ui/pokemonTypeTheme";
import { Chip } from "../common/Chip";

interface PokemonCardProps {
  pokemon: Pokemon;
  actionLabel?: string;
  onAction?: (pokemonId: string) => void;
  disabled?: boolean;
  reasons?: string[];
}

export const PokemonCard = ({ pokemon, actionLabel, onAction, disabled, reasons }: PokemonCardProps) => {
  const primaryTypeId = pokemon.typeIds[0];
  const typeTheme = getPokemonTypeTheme(primaryTypeId);

  return (
    <article
      className={`card-shell overflow-hidden rounded-[2rem] border p-5 ${typeTheme.cardClass} shadow-[0_24px_50px_rgba(17,34,23,0.09)]`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {pokemon.dexNumber ? (
              <span className="type-overline inline-flex rounded-full border border-ink/12 bg-white/65 px-2.5 py-1 text-ink/75">
                #{String(pokemon.dexNumber).padStart(3, "0")}
              </span>
            ) : null}
            <span className={`type-caption type-ui-strong inline-flex rounded-full border px-2.5 py-1 ${typeTheme.badgeClass}`}>
              {typeTheme.typeLabel}
            </span>
          </div>

          <Link to={`/pokemon/${pokemon.slug}`} className="type-h3 font-display text-ink hover:text-moss">
            {pokemon.fullDisplayName}
          </Link>

          <p className="type-body mt-1 text-ink/64">
            {pokemon.specialtyIds.map((specialtyId) => specialtyById.get(specialtyId)?.name ?? specialtyId).join(" · ")}
          </p>
        </div>

        {pokemon.imageUrl ? (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/65 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <img src={pokemon.imageUrl} alt={pokemon.fullDisplayName} className="h-16 w-16 object-contain" />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {pokemon.favoriteCategoryIds.map((categoryId) => (
          <Chip key={categoryId}>{favoriteCategoryById.get(categoryId)?.name ?? categoryId}</Chip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {pokemon.idealHabitatTraitIds.map((traitId) => (
          <Chip key={traitId} tone="warning">
            {habitatTraitById.get(traitId)?.label ?? traitId}
          </Chip>
        ))}
      </div>

      {reasons?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
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
          className="type-ui type-ui-strong mt-4 w-full rounded-full border border-ink/12 bg-white/78 px-4 py-2.5 text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
};

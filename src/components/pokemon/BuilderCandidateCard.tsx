import { favoriteCategoryById } from "../../data/favoriteCategories";
import { habitatById } from "../../data/habitats";
import type { Pokemon } from "../../lib/types";
import { getPokemonTypeTheme } from "../../lib/ui/pokemonTypeTheme";

interface BuilderCandidateCardProps {
  entry: Pokemon;
  disabled: boolean;
  onAdd: (pokemonId: string) => void;
  primaryHabitatLabel: string;
  idealHabitatLabel: string;
  sharedFavoriteCategoryIds?: string[];
  sharedHabitatIds?: string[];
  compactVisual: boolean;
}

export const BuilderCandidateCard = ({
  entry,
  disabled,
  onAdd,
  primaryHabitatLabel,
  idealHabitatLabel,
  sharedFavoriteCategoryIds = [],
  sharedHabitatIds = [],
  compactVisual,
}: BuilderCandidateCardProps) => {
  const typeTheme = getPokemonTypeTheme(entry.typeIds[0]);
  const favoriteCategoryIdsToShow =
    sharedFavoriteCategoryIds.length > 0 ? sharedFavoriteCategoryIds : entry.favoriteCategoryIds;
  const sharedChipClass = "inline-flex rounded-full bg-moss/18 px-4 py-2 text-moss text-xs";
  const defaultChipClass = "inline-flex rounded-full bg-[#f5f5f5] px-4 py-2 text-[#4a4a4a] text-xs";

  return (
    <button
      key={entry.id}
      type="button"
      disabled={disabled}
      onClick={() => onAdd(entry.id)}
      className="relative w-full min-w-[240px] justify-self-start overflow-hidden rounded-[2.8rem] border-[6px] border-[#d7ecf0] text-left transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: typeTheme.surfaceColor }}
    >
      <div className="relative flex min-h-[36rem] flex-col">
        {/* Roomies.CandidateCard.Header */}
        <div className="px-8 pb-0 pt-8">
          <div className="flex items-start justify-between gap-3">
            {entry.dexNumber ? (
              <p className="text-white/90">#{String(entry.dexNumber).padStart(3, "0")}</p>
            ) : (
              <span />
            )}
          </div>
          <p
            className={`font-display text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.05)] ${
              compactVisual ? "text-2xl" : "type-h2"
            }`}
          >
            {entry.fullDisplayName}
          </p>
        </div>

        {/* Roomies.CandidateCard.Sprite */}
        <div className="relative z-10 flex flex-1 items-end justify-center px-8 pb-0">
          {entry.imageUrl ? (
            <img
              src={entry.imageUrl}
              alt=""
              className={`${compactVisual ? "h-32 w-32" : "h-64 w-64"} object-contain drop-shadow-[0_12px_12px_rgba(0,0,0,0.12)]`}
            />
          ) : null}
        </div>

        {/* Roomies.CandidateCard.FavoritesPanel */}
        <div className="relative z-20 -mt-2 rounded-t-[2.5rem] bg-[#fff] px-7 pb-8 pt-9">
          <p className="text-sm type-ui-strong text-center text-[#94969b]">
            {sharedFavoriteCategoryIds.length > 0 ? "Shared favorites" : "Favorites"}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {favoriteCategoryIdsToShow.map((categoryId) => (
              <span
                key={categoryId}
                className={sharedFavoriteCategoryIds.length > 0 ? sharedChipClass : defaultChipClass}
              >
                {favoriteCategoryById.get(categoryId)?.name ?? categoryId}
              </span>
            ))}
          </div>

          <p className="type-caption mt-4 text-center text-[#7f8288]/85">
            Ideal habitat: {idealHabitatLabel}
            {sharedHabitatIds.length > 0
              ? ` · shared habitat: ${habitatById.get(sharedHabitatIds[0])?.name ?? sharedHabitatIds[0]}`
              : ""}
          </p>
        </div>
      </div>
    </button>
  );
};

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
}

export const BuilderCandidateCard = ({
  entry,
  disabled,
  onAdd,
  primaryHabitatLabel,
  idealHabitatLabel,
  sharedFavoriteCategoryIds = [],
  sharedHabitatIds = [],
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
      className="relative w-full min-w-[240px] justify-self-start overflow-hidden rounded-[2.8rem] border-[6px] border-[#BBD6DF] text-left transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: typeTheme.surfaceColor }}
    >
      <div className="relative flex flex-col">
        {/* Roomies.CandidateCard.Header */}
        <div className="relative px-8 pt-8 mb-5">
          {entry.dexNumber ? (
              <p className="text-white/90">#{String(entry.dexNumber).padStart(3, "0")}</p>
            ) : (
              <span />
            )}
          <p className="font-display text-2xl text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            {entry.fullDisplayName}
          </p>
        </div>

        {/* Roomies.CandidateCard.Sprite */}
        {entry.imageUrl ? (
          <div
            className="z-30"
            style={{
              position: 'absolute',
              right: 0,
              top: 12
            }}
          >
            <img
              src={entry.imageUrl}
              alt=""
              className="h-30 w-30 object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.16)]"
            />
          </div>
        ) : null}

        {/* Roomies.CandidateCard.FavoritesPanel */}
        <div className="relative z-20 mt-auto rounded-t-[1.75rem] bg-[#fff] px-7 pb-8 pt-9">
          <p className="text-sm type-ui-strong text-left text-[#94969b]">
            {sharedFavoriteCategoryIds.length > 0 ? "Shared favorites" : "Favorites"}
          </p>
          <div className="mt-1 flex flex-wrap justify-start gap-1">
            {favoriteCategoryIdsToShow.map((categoryId) => (
              <span
                key={categoryId}
                className={sharedFavoriteCategoryIds.length > 0 ? sharedChipClass : defaultChipClass}
              >
                {favoriteCategoryById.get(categoryId)?.name ?? categoryId}
              </span>
            ))}
          </div>

          <p className="type-caption mt-4 text-left text-[#7f8288]/85">
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

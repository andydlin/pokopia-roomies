import { favoriteCategoryById } from "../../data/favoriteCategories";
import { habitatTraitById } from "../../data/habitatTraits";
import { getSharedFavoriteCategories } from "../../lib/favorites";
import type { Pokemon } from "../../lib/types";

interface SelectedPokemonPanelProps {
  selected: Pokemon[];
  onRemove: (pokemonId: string) => void;
  maxSize: number;
}

const getIdealHabitatLabel = (entry: Pokemon) =>
  entry.idealHabitatTraitIds.length === 0
    ? "None listed"
    : entry.idealHabitatTraitIds.map((traitId) => habitatTraitById.get(traitId)?.label ?? traitId).join(", ");

export const SelectedPokemonPanel = ({ selected, onRemove, maxSize }: SelectedPokemonPanelProps) => {
  const sharedByAllCategoryIds = getSharedFavoriteCategories(selected);
  const favoriteCounts = new Map<string, number>();
  selected.forEach((entry) => {
    new Set(entry.favoriteCategoryIds).forEach((categoryId) => {
      favoriteCounts.set(categoryId, (favoriteCounts.get(categoryId) ?? 0) + 1);
    });
  });
  const mostThreshold = Math.max(2, Math.ceil(selected.length * 0.6));
  const sharedByMostCategoryIds = [...favoriteCounts.entries()]
    .filter(([categoryId, count]) => count >= mostThreshold && !sharedByAllCategoryIds.includes(categoryId))
    .sort((a, b) => b[1] - a[1])
    .map(([categoryId]) => categoryId);

  const memberIdsForMost = selected
    .filter((entry) =>
      entry.favoriteCategoryIds.some((categoryId) => sharedByMostCategoryIds.includes(categoryId)),
    )
    .map((entry) => entry.id);

  return (
    <div className="relative overflow-hidden rounded-[32px] border-4 border-[#bbd6df] bg-[#fff8ef] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[102px] bg-[#5f93ce]" />
      <div className="pointer-events-none absolute left-[-14px] top-[76px] h-[34px] w-[182px] rounded-[50%] bg-[#fff8ef]" />
      <div className="pointer-events-none absolute right-[-14px] top-[76px] h-[34px] w-[182px] rounded-[50%] bg-[#fff8ef]" />

      <div className="relative">
        <h3 className="type-h1 text-white">Pokemon Group</h3>

        <div className="relative mt-12">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-[#d8cfc1]" />
          <div className="mx-auto w-fit rounded-full border border-dashed border-[#d8cfc1] bg-[#fff8ef] px-4 py-1.5">
            <p className="type-ui type-ui-strong text-[#999]">Pokemon ({selected.length}/{maxSize})</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {selected.map((entry) => {
            const sharedFavoriteCount = entry.favoriteCategoryIds.filter((categoryId) =>
              favoriteCounts.has(categoryId) && (favoriteCounts.get(categoryId) ?? 0) >= 2,
            ).length;

            return (
              <button
                type="button"
                key={entry.id}
                onClick={() => onRemove(entry.id)}
                className="flex w-full items-start gap-3 rounded-2xl border border-[#d5c5b1] bg-white px-4 py-2 text-left transition hover:border-[#c4b29c]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e0f3f9]">
                  {entry.imageUrl ? <img src={entry.imageUrl} alt="" className="h-9 w-9 object-contain" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="type-h3 text-[#1a1a1a]">{entry.fullDisplayName}</p>
                  <p className="type-caption text-[rgba(26,26,26,0.5)]">
                    {getIdealHabitatLabel(entry).split(",")[0]} · {sharedFavoriteCount} shared favorites
                  </p>
                </div>
              </button>
            );
          })}

          {Array.from({ length: Math.max(0, maxSize - selected.length) }).map((_, index) => (
            <div
              key={`placeholder-${index + 1}`}
              className="flex h-[60px] items-center justify-center rounded-lg border border-dashed border-[#d5c5b1] text-center"
            >
              <p className="type-h3 text-[#d5c5b1]">Choose a Pokemon</p>
            </div>
          ))}
        </div>

        <div className="mt-28 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="type-ui type-ui-strong flex-1 text-[#999]">Shared by all</p>
              <div className="flex items-center pr-1">
                {selected.slice(0, 6).map((entry) => (
                  <span
                    key={`all-avatar-${entry.id}`}
                    className="-mr-1.5 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-[#fffbf6] bg-[#f5e9d8]"
                  >
                    {entry.imageUrl ? <img src={entry.imageUrl} alt="" className="h-5 w-5 object-contain" /> : null}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {sharedByAllCategoryIds.slice(0, 2).map((categoryId, index) => (
                <span
                  key={`shared-all-${categoryId}`}
                  className={`type-caption inline-flex rounded-full px-2.5 py-1.5 ${
                    index === 0 ? "bg-[#81a9d5] text-white" : "bg-[#f5f5f5] text-[#4a4a4a]"
                  }`}
                >
                  {favoriteCategoryById.get(categoryId)?.name ?? categoryId}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="type-ui type-ui-strong flex-1 text-[#999]">Shared by most</p>
              <div className="flex items-center pr-1">
                {selected
                  .filter((entry) => memberIdsForMost.includes(entry.id))
                  .slice(0, 4)
                  .map((entry) => (
                    <span
                      key={`most-avatar-${entry.id}`}
                      className="-mr-1.5 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-[#fffbf6] bg-[#f5e9d8]"
                    >
                      {entry.imageUrl ? <img src={entry.imageUrl} alt="" className="h-5 w-5 object-contain" /> : null}
                    </span>
                  ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {sharedByMostCategoryIds.slice(0, 2).map((categoryId, index) => (
                <span
                  key={`shared-most-${categoryId}`}
                  className={`type-caption inline-flex rounded-full px-2.5 py-1.5 ${
                    index === 0 ? "bg-[#81a9d5] text-white" : "bg-[#f5f5f5] text-[#4a4a4a]"
                  }`}
                >
                  {favoriteCategoryById.get(categoryId)?.name ?? categoryId}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

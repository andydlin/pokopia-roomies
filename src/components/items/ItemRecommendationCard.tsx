import { favoriteCategoryById } from "../../data/favoriteCategories";
import { itemById } from "../../data/items";
import { pokemonById } from "../../data/pokemon";
import type { ItemRecommendation, RecommendedCategory } from "../../lib/types";
import { Chip } from "../common/Chip";

export const RecommendedCategoryCard = ({
  recommendation,
  teamSize,
}: {
  recommendation: RecommendedCategory;
  teamSize: number;
}) => {
  const category = favoriteCategoryById.get(recommendation.categoryId);
  return (
    <div className="rounded-[1.6rem] border border-white/70 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{category?.name ?? recommendation.categoryId}</h3>
          <p className="text-sm text-ink/62">Coverage {recommendation.matchedPokemonIds.length}/{teamSize}</p>
        </div>
        <Chip tone="accent">{recommendation.itemCount} items</Chip>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.matchedPokemonIds.map((pokemonId) => (
          <Chip key={pokemonId}>{pokemonById.get(pokemonId)?.name ?? pokemonId}</Chip>
        ))}
      </div>
    </div>
  );
};

export const ItemRecommendationCard = ({
  recommendation,
  teamSize,
}: {
  recommendation: ItemRecommendation;
  teamSize: number;
}) => {
  const item = itemById.get(recommendation.itemId);
  return (
    <div className="rounded-[1.6rem] border border-white/70 bg-white/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{item?.name ?? recommendation.itemId}</h3>
          <p className="text-sm text-ink/62">Coverage {recommendation.matchedPokemonIds.length}/{teamSize}</p>
        </div>
        <Chip tone={item?.craftable ? "accent" : "default"}>{item?.craftable ? "Craftable" : "Source only"}</Chip>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.matchedFavoriteCategoryIds.map((categoryId) => (
          <Chip key={categoryId}>{favoriteCategoryById.get(categoryId)?.name ?? categoryId}</Chip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.matchedPokemonIds.map((pokemonId) => (
          <Chip key={pokemonId} tone="warning">
            {pokemonById.get(pokemonId)?.name ?? pokemonId}
          </Chip>
        ))}
      </div>
    </div>
  );
};

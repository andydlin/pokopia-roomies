import { favoriteCategoryById } from "../../data/favoriteCategories";
import { Chip } from "../common/Chip";

interface SharedFavoritesCardProps {
  title: string;
  categoryIds: string[];
  helper?: string;
}

export const SharedFavoritesCard = ({ title, categoryIds, helper }: SharedFavoritesCardProps) => (
  <div className="rounded-[1.6rem] border border-white/70 bg-white/70 p-4">
    <h3 className="type-h3 text-ink">{title}</h3>
    {helper ? <p className="type-body mt-1 text-ink/62">{helper}</p> : null}
    <div className="mt-3 flex flex-wrap gap-2">
      {categoryIds.length === 0 ? (
        <p className="type-body text-ink/58">No overlap yet.</p>
      ) : (
        categoryIds.map((categoryId) => <Chip key={categoryId}>{favoriteCategoryById.get(categoryId)?.name ?? categoryId}</Chip>)
      )}
    </div>
  </div>
);

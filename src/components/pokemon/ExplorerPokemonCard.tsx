import { Link } from "react-router-dom";
import type { ExplorerResult } from "../../lib/types";
import { Chip } from "../common/Chip";

export const ExplorerPokemonCard = ({ result }: { result: ExplorerResult }) => {
  const { entry, compatibilityPotential } = result;

  return (
    <article className="card-shell rounded-[1.9rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to={`/pokemon/${entry.slug}`} className="text-xl font-semibold text-ink hover:text-moss">
            {entry.number ? `#${String(entry.number).padStart(3, "0")} ${entry.name}` : entry.name}
          </Link>
          <p className="mt-1 text-sm text-ink/62">Ideal habitat: {entry.idealHabitat}</p>
        </div>
        <div className="text-right">
          <div className="rounded-full bg-moss/12 px-3 py-1 text-sm font-semibold text-ink">
            {compatibilityPotential}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-ink/50">Potential</p>
        </div>
      </div>

      {entry.image ? <img src={entry.image} alt={entry.name} className="mt-4 h-24 w-24 object-contain" /> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="warning">{entry.idealHabitat}</Chip>
        {entry.specialties.map((specialty) => (
          <Chip key={specialty}>{specialty}</Chip>
        ))}
      </div>

      <p className="mt-4 text-sm text-ink/68">
        Favorites: {entry.favorites.slice(0, 2).join(", ")}
        {entry.favorites.length > 2 ? ` +${entry.favorites.length - 2} more` : ""}
      </p>

      <p className="mt-2 text-sm text-ink/60">
        Item categories: {entry.favoriteItemCategories.slice(0, 2).join(", ")}
        {entry.favoriteItemCategories.length > 2 ? ` +${entry.favoriteItemCategories.length - 2} more` : ""}
      </p>
    </article>
  );
};

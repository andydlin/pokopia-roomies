import { Link } from "react-router-dom";
import { pokemonById } from "../../data/pokemon";
import type { ExplorerResult } from "../../lib/types";
import { getPokemonTypeTheme } from "../../lib/ui/pokemonTypeTheme";
import { Chip } from "../common/Chip";

export const ExplorerPokemonCard = ({ result }: { result: ExplorerResult }) => {
  const { entry, compatibilityPotential } = result;
  const primaryTypeId = pokemonById.get(entry.id)?.typeIds[0];
  const typeTheme = getPokemonTypeTheme(primaryTypeId);

  return (
    <article className={`card-shell rounded-[1.9rem] p-4 ${typeTheme.cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to={`/pokemon/${entry.slug}`} className="type-h3 text-ink hover:text-moss">
            {entry.number ? `#${String(entry.number).padStart(3, "0")} ${entry.name}` : entry.name}
          </Link>
          <p className="type-body mt-1 text-ink/62">Ideal habitat: {entry.idealHabitat}</p>
          <span className={`type-caption type-ui-strong mt-2 inline-flex rounded-full border px-2.5 py-1 ${typeTheme.badgeClass}`}>
            {typeTheme.typeLabel}
          </span>
        </div>
        <div className="text-right">
          <div className="type-ui type-ui-strong rounded-full bg-moss/12 px-3 py-1 text-ink">
            {compatibilityPotential}
          </div>
          <p className="type-overline mt-1 text-ink/50">Potential</p>
        </div>
      </div>

      {entry.image ? <img src={entry.image} alt={entry.name} className="mt-4 h-24 w-24 object-contain" /> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="warning">{entry.idealHabitat}</Chip>
        {entry.specialties.map((specialty) => (
          <Chip key={specialty}>{specialty}</Chip>
        ))}
      </div>

      <p className="type-body mt-4 text-ink/68">
        Favorites: {entry.favorites.slice(0, 2).join(", ")}
        {entry.favorites.length > 2 ? ` +${entry.favorites.length - 2} more` : ""}
      </p>

      <p className="type-body mt-2 text-ink/60">
        Item categories: {entry.favoriteItemCategories.slice(0, 2).join(", ")}
        {entry.favoriteItemCategories.length > 2 ? ` +${entry.favoriteItemCategories.length - 2} more` : ""}
      </p>
    </article>
  );
};

import { type KeyboardEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { favoriteCategories } from "../../../data/favoriteCategories";
import { Chip } from "../../../components/common/Chip";
import { useHomeBuilder } from "../../home-builder/state/HomeBuilderContext";

const categoryLabel = (categoryId: string) =>
  favoriteCategories.find((entry) => entry.id === categoryId)?.name ??
  categoryId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
const MAX_POKEMON_FAVORITES_TO_SHOW = 6;
const activateWithKeyboard = (
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
};

export const PokedexPokemonPage = () => {
  const { entities, dispatch } = useHomeBuilder();
  const [query, setQuery] = useState("");
  const [detailPokemonId, setDetailPokemonId] = useState<string | null>(null);
  const pokemon = useMemo(
    () =>
      entities.allPokemonIds
        .map((id) => entities.pokemonById[id])
        .filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase())),
    [entities, query],
  );

  return (
    <div className="space-y-4">
      <section>
        <p className="type-overline text-moss/60">Pokedex</p>
        <h2 className="type-h2 mt-1 text-ink">Pokemon</h2>
      </section>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Pokemon"
        className="type-ui w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-3"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pokemon.map((entry) => (
          <article
            key={entry.id}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDetailPokemonId(entry.id);
            }}
            onKeyDown={(event) => activateWithKeyboard(event, () => setDetailPokemonId(entry.id))}
            className="rounded-2xl border border-white/70 bg-white/85 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="type-ui type-ui-strong text-ink">{entry.name}</p>
              {entry.imageUrl ? <img src={entry.imageUrl} alt={entry.name} className="h-14 w-14 rounded-lg bg-paper object-contain p-1" /> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.favoriteCategoryIds.slice(0, MAX_POKEMON_FAVORITES_TO_SHOW).map((categoryId) => (
                <Chip key={`${entry.id}-${categoryId}`}>{categoryLabel(categoryId)}</Chip>
              ))}
            </div>
          </article>
        ))}
      </div>
      {detailPokemonId ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 md:items-center" onClick={() => setDetailPokemonId(null)}>
          <section
            className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const selected = entities.pokemonById[detailPokemonId];
              if (!selected) return null;
              return (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="type-overline text-moss/60">Pokemon details</p>
                      <h3 className="type-h2 mt-1 text-ink">{selected.name}</h3>
                    </div>
                    <button type="button" onClick={() => setDetailPokemonId(null)} className="type-ui rounded-full border border-ink/10 bg-white px-4 py-2">
                      Back to results
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {selected.imageUrl ? <img src={selected.imageUrl} alt={selected.name} className="h-28 w-28 rounded-xl bg-paper object-contain p-1" /> : null}
                    <div className="flex flex-wrap gap-2">
                      {selected.favoriteCategoryIds.map((categoryId) => (
                        <Chip key={categoryId}>{categoryLabel(categoryId)}</Chip>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "home/add-pokemon", pokemonId: selected.id })}
                      className="type-ui type-ui-strong rounded-full border border-ink/10 bg-white px-5 py-2 text-ink"
                    >
                      Add to Home
                    </button>
                  </div>
                </>
              );
            })()}
          </section>
        </div>
      ) : null}
    </div>
  );
};

export const PokedexItemsPage = () => {
  const { entities, dispatch } = useHomeBuilder();
  const [query, setQuery] = useState("");
  const items = useMemo(
    () =>
      entities.allItemIds
        .map((id) => entities.itemsById[id])
        .filter((entry) => [entry.name, entry.generalCategoryLabel].join(" ").toLowerCase().includes(query.toLowerCase())),
    [entities, query],
  );

  return (
    <div className="space-y-4">
      <section>
        <p className="type-overline text-moss/60">Pokedex</p>
        <h2 className="type-h2 mt-1 text-ink">Items</h2>
      </section>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search items"
        className="type-ui w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-3"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-white/70 bg-white/85 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="type-ui type-ui-strong text-ink">{entry.name}</p>
              {entry.image ? <img src={entry.image} alt={entry.name} className="h-14 w-14 rounded-lg bg-paper object-contain p-1" /> : null}
            </div>
            <p className="type-caption mt-1 text-ink/70">{entry.generalCategoryLabel}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.comfortCategoryIds.length > 0 ? (
                entry.comfortCategoryIds.slice(0, 3).map((categoryId) => (
                  <Chip key={`${entry.id}-${categoryId}`}>{categoryLabel(categoryId)}</Chip>
                ))
              ) : (
                <Chip>No comfort tags</Chip>
              )}
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "home/add-item", itemId: entry.id })}
              className="type-caption mt-3 rounded-full border border-ink/10 bg-white px-3 py-1 text-ink"
            >
              Add to Home
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};

export const PokedexHabitatsPage = () => {
  const { entities, dispatch } = useHomeBuilder();
  const [query, setQuery] = useState("");
  const habitats = useMemo(
    () =>
      entities.allHabitatIds
        .map((id) => entities.habitatsById[id])
        .filter((entry) => entry.name.toLowerCase().includes(query.toLowerCase())),
    [entities, query],
  );

  return (
    <div className="space-y-4">
      <section>
        <p className="type-overline text-moss/60">Pokedex</p>
        <h2 className="type-h2 mt-1 text-ink">Habitats</h2>
      </section>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search habitats"
        className="type-ui w-full rounded-2xl border border-ink/10 bg-white/90 px-4 py-3"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {habitats.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-white/70 bg-white/85 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="type-ui type-ui-strong text-ink">{entry.name}</p>
              {entry.image ? <img src={entry.image} alt={entry.name} className="h-14 w-14 rounded-lg bg-paper object-cover" /> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.relatedComfortCategoryIds.slice(0, 3).map((categoryId) => (
                <Chip key={`${entry.id}-${categoryId}`}>{categoryLabel(categoryId)}</Chip>
              ))}
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "home/set-habitat", habitatId: entry.id })}
              className="type-caption mt-3 rounded-full bg-moss px-3 py-1 text-paper"
            >
              Set as Habitat
            </button>
          </article>
        ))}
      </div>
      <Link to="/builder" className="type-ui inline-flex rounded-full border border-ink/10 bg-white px-4 py-2">
        Back to Home Builder
      </Link>
    </div>
  );
};

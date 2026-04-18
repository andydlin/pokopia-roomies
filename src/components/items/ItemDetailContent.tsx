import { useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import type { Location } from "react-router-dom";
import { favoriteCategoryById } from "../../data/favoriteCategories";
import { habitats } from "../../data/habitats";
import { items } from "../../data/items";
import type { Item } from "../../domain/types";
import { Chip } from "../common/Chip";

interface ItemDetailContentProps {
  item: Item;
}

const decodeFromParam = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
};

export const ItemDetailContent = ({ item }: ItemDetailContentProps) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location; modal?: boolean } | null;
  const backgroundLocation = state?.backgroundLocation;
  const fromPath = decodeFromParam(searchParams.get("from"), "/items");
  const itemDetailSearch = `?from=${encodeURIComponent(fromPath)}`;
  const modalState = backgroundLocation ? { backgroundLocation, modal: true } : undefined;

  const itemByName = useMemo(
    () =>
      new Map(
        items.map((entry) => [entry.name.trim().toLowerCase(), entry]),
      ),
    [],
  );

  const habitatsForItem = useMemo(
    () =>
      habitats.filter((habitat) =>
        (habitat.requiredItems ?? []).some((requirement) => requirement.itemId === item.id),
      ),
    [item.id],
  );

  const recipesUsingItem = useMemo(() => {
    const normalizedSelectedName = item.name.trim().toLowerCase();
    return items.filter((entry) =>
      entry.materials.some((material) => material.itemName.trim().toLowerCase() === normalizedSelectedName),
    );
  }, [item.name]);

  return (
    <>
      <div className="mt-4 grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-ink/8 bg-white/80 p-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-32 w-full rounded-xl bg-white object-contain p-2"
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <p className="type-ui type-ui-strong text-ink/75">Comfort tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.comfortCategoryLabels.length > 0 ? (
                item.comfortCategoryLabels.map((tag) => (
                  <Chip key={`${item.id}-tag-${tag}`} tone="warning">
                    {tag}
                  </Chip>
                ))
              ) : (
                <p className="type-caption text-ink/55">No comfort tags listed.</p>
              )}
            </div>
          </div>

          <div>
            <p className="type-ui type-ui-strong text-ink/75">Favorite categories</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.favoriteCategoryIds.length > 0 ? (
                item.favoriteCategoryIds.map((categoryId) => {
                  const categoryName = favoriteCategoryById.get(categoryId)?.name ?? categoryId;
                  return (
                    <Link key={`${item.id}-fav-${categoryId}`} to={`/lookup?favoriteCategoryId=${encodeURIComponent(categoryId)}`}>
                      <Chip>{categoryName}</Chip>
                    </Link>
                  );
                })
              ) : (
                <p className="type-caption text-ink/55">No favorite-category links listed.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {item.materials.length > 0 ? (
        <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
          <p className="type-ui type-ui-strong text-ink/75">Materials required</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {item.materials.map((material) => {
              const materialItem = itemByName.get(material.itemName.trim().toLowerCase()) ?? null;
              return (
                <li key={`${item.id}-${material.itemName}`}>
                  {materialItem ? (
                    <Link
                      to={{
                        pathname: `/items/${materialItem.id}`,
                        search: itemDetailSearch,
                      }}
                      state={modalState}
                      className="type-caption flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-left text-ink/75 transition hover:border-moss/35"
                    >
                      {materialItem.imageUrl ? (
                        <img
                          src={materialItem.imageUrl}
                          alt={material.itemName}
                          className="h-6 w-6 rounded-md bg-white object-contain p-0.5"
                        />
                      ) : null}
                      <span>
                        {material.itemName} × {material.quantity}
                      </span>
                    </Link>
                  ) : (
                    <span className="type-caption flex items-center gap-2 text-ink/75">
                      {material.itemName} × {material.quantity}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {item.obtainabilityDetails && item.obtainabilityDetails.length > 0 ? (
        <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
          <p className="type-ui type-ui-strong text-ink/75">How to obtain</p>
          <ul className="mt-2 space-y-1">
            {item.obtainabilityDetails.map((detail) => (
              <li key={`${item.id}-obtain-${detail}`} className="type-caption text-ink/72">
                {detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {habitatsForItem.length > 0 ? (
        <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
          <p className="type-ui type-ui-strong text-ink/75">Used in habitats</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {habitatsForItem.map((habitat) => (
              <Link
                key={`${item.id}-habitat-${habitat.id}`}
                to={{ pathname: `/habitats/${habitat.id}`, search: `?from=${encodeURIComponent(fromPath)}` }}
                state={modalState}
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1"
              >
                {habitat.imageUrl ? (
                  <img src={habitat.imageUrl} alt={habitat.name} className="h-5 w-5 rounded-full object-cover" />
                ) : null}
                <span className="type-caption text-ink/80">{habitat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {recipesUsingItem.length > 0 ? (
        <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
          <p className="type-ui type-ui-strong text-ink/75">Used in recipes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recipesUsingItem.map((recipeItem) => (
              <Link
                key={`${item.id}-recipe-${recipeItem.id}`}
                to={{ pathname: `/items/${recipeItem.id}`, search: itemDetailSearch }}
                state={modalState}
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-left transition hover:border-moss/35"
              >
                {recipeItem.imageUrl ? (
                  <img src={recipeItem.imageUrl} alt={recipeItem.name} className="h-5 w-5 rounded-full bg-white object-contain p-0.5" />
                ) : null}
                <span className="type-caption text-ink/80">{recipeItem.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

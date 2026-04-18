import { useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import type { Location } from "react-router-dom";
import { itemById, items } from "../../data/items";
import type { Habitat } from "../../domain/types";

interface HabitatDetailContentProps {
  habitat: Habitat;
}

const normalizeItemKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const singularize = (value: string) => value.replace(/s$/i, "");

const decodeFromParam = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
};

export const HabitatDetailContent = ({ habitat }: HabitatDetailContentProps) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location; modal?: boolean } | null;
  const backgroundLocation = state?.backgroundLocation;
  const fromPath = decodeFromParam(searchParams.get("from"), "/habitats");
  const detailSearch = `?from=${encodeURIComponent(fromPath)}`;
  const modalState = backgroundLocation ? { backgroundLocation, modal: true } : undefined;

  const itemByNormalizedName = useMemo(
    () => new Map(items.map((item) => [normalizeItemKey(item.name), item])),
    [],
  );
  const itemByNormalizedId = useMemo(
    () => new Map(items.map((item) => [normalizeItemKey(item.id), item])),
    [],
  );

  return (
    <>
      <div className="mt-4 grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-ink/8 bg-white/80 p-3">
          {habitat.imageUrl ? (
            <img src={habitat.imageUrl} alt={habitat.name} className="h-32 w-full rounded-xl bg-white object-cover" />
          ) : null}
        </div>
        <div className="space-y-3">
          <p className="type-caption text-ink/60">#{habitat.number}</p>
          {habitat.description ? <p className="type-body text-ink/75">{habitat.description}</p> : null}
          <div>
            <p className="type-ui type-ui-strong text-ink/75">Required items</p>
            {habitat.requiredItems && habitat.requiredItems.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {habitat.requiredItems.map((requirement) => {
                  const resolvedItem =
                    itemById.get(requirement.itemId) ??
                    itemByNormalizedId.get(normalizeItemKey(requirement.itemId)) ??
                    itemByNormalizedName.get(normalizeItemKey(requirement.itemName)) ??
                    itemByNormalizedName.get(normalizeItemKey(singularize(requirement.itemName))) ??
                    null;
                  const chipBody = (
                    <>
                      {resolvedItem?.imageUrl ? (
                        <img
                          src={resolvedItem.imageUrl}
                          alt={resolvedItem.name ?? requirement.itemName}
                          className="h-5 w-5 rounded-full bg-white object-contain"
                        />
                      ) : null}
                      <span className="type-caption text-ink/80">
                        {(resolvedItem?.name ?? requirement.itemName) + ` × ${requirement.quantity}`}
                      </span>
                    </>
                  );

                  return resolvedItem ? (
                    <Link
                      key={`${habitat.id}-${requirement.itemId}-${requirement.itemName}`}
                      to={{ pathname: `/items/${resolvedItem.id}`, search: detailSearch }}
                      state={modalState}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1"
                    >
                      {chipBody}
                    </Link>
                  ) : (
                    <span
                      key={`${habitat.id}-${requirement.itemId}-${requirement.itemName}`}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1"
                    >
                      {chipBody}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="type-caption mt-1 text-ink/55">No specific required items listed.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

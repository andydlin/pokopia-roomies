import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SectionCard } from "../components/common/SectionCard";
import { itemById, items } from "../data/items";
import { habitats } from "../data/habitats";

export const HabitatsPage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const normalizeItemKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const itemByNormalizedName = useMemo(
    () => new Map(items.map((item) => [normalizeItemKey(item.name), item])),
    [],
  );

  const filteredHabitats = useMemo(
    () =>
      habitats.filter((habitat) => {
        if (!query) return true;
        return [habitat.name, habitat.slug, habitat.description ?? ""].join(" ").toLowerCase().includes(query.toLowerCase());
      }),
    [query],
  );

  return (
    <div className="space-y-6">
      <SectionCard eyebrow="Habitats" title={`All habitats (${habitats.length})`} description="Browse habitat requirements and required items in one place.">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search habitats"
          className="type-ui w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
        />
      </SectionCard>

      <SectionCard eyebrow="Results" title={`${filteredHabitats.length} habitats`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredHabitats.map((habitat) => (
            <article key={habitat.id} className="rounded-[1.6rem] border border-white/70 bg-white/75 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="type-h3 text-ink">{habitat.name}</h3>
                  <p className="type-caption text-ink/60">#{habitat.number}</p>
                </div>
                {habitat.imageUrl ? (
                  <img src={habitat.imageUrl} alt={habitat.name} className="h-16 w-16 rounded-xl bg-white object-cover" />
                ) : null}
              </div>

              {habitat.description ? <p className="type-caption mt-2 text-ink/70">{habitat.description}</p> : null}

              <div className="mt-3">
                <p className="type-ui type-ui-strong text-ink/75">Required items</p>
                {habitat.requiredItems && habitat.requiredItems.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {habitat.requiredItems.map((requirement) => {
                      const resolvedItem =
                        itemById.get(requirement.itemId) ??
                        itemByNormalizedName.get(normalizeItemKey(requirement.itemName)) ??
                        null;
                      return (
                        <span
                          key={`${habitat.id}-${requirement.itemId}-${requirement.itemName}`}
                          className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1"
                        >
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
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="type-caption mt-1 text-ink/55">No specific required items listed.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

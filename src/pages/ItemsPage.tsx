import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Chip } from "../components/common/Chip";
import { SectionCard } from "../components/common/SectionCard";
import { favoriteCategoryById } from "../data/favoriteCategories";
import { habitats } from "../data/habitats";
import { comfortItemCategoryOptions, items } from "../data/items";

const toLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const ItemsPage = () => {
  const [query, setQuery] = useState("");
  const [generalCategory, setGeneralCategory] = useState<string>("all");
  const [comfortCategory, setComfortCategory] = useState<string>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const generalCategoryOptions = useMemo(
    () =>
      [...new Set(items.map((item) => item.itemCategory).filter((value): value is string => Boolean(value)))].sort(
        (left, right) => left.localeCompare(right),
      ),
    [],
  );

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => {
        if (query) {
          const haystack = [item.name, item.slug, item.itemCategoryLabel ?? "", ...(item.comfortCategoryLabels ?? [])]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query.toLowerCase())) return false;
        }

        if (generalCategory !== "all" && item.itemCategory !== generalCategory) return false;
        if (comfortCategory !== "all" && !item.comfortCategoryIds.includes(comfortCategory)) return false;
        return true;
      })
        .sort((left, right) => {
          const leftCategory = left.itemCategoryLabel ?? "Unknown";
          const rightCategory = right.itemCategoryLabel ?? "Unknown";
          return leftCategory.localeCompare(rightCategory) || left.name.localeCompare(right.name);
        }),
    [query, generalCategory, comfortCategory],
  );
  const itemsByCategory = useMemo(() => {
    const groups = new Map<string, typeof filteredItems>();
    filteredItems.forEach((item) => {
      const key = item.itemCategoryLabel ?? "Unknown";
      const existing = groups.get(key) ?? [];
      existing.push(item);
      groups.set(key, existing);
    });
    return [...groups.entries()];
  }, [filteredItems]);
  const selectedItem = useMemo(
    () => (selectedItemId ? items.find((item) => item.id === selectedItemId) ?? null : null),
    [selectedItemId],
  );
  const habitatsForSelectedItem = useMemo(() => {
    if (!selectedItem) return [];
    return habitats.filter((habitat) =>
      (habitat.requiredItems ?? []).some((requirement) => requirement.itemId === selectedItem.id),
    );
  }, [selectedItem]);
  const recipesUsingSelectedItem = useMemo(() => {
    if (!selectedItem) return [];
    const normalizedSelectedName = selectedItem.name.trim().toLowerCase();
    return items.filter((item) =>
      item.materials.some((material) => material.itemName.trim().toLowerCase() === normalizedSelectedName),
    );
  }, [selectedItem]);
  const itemByName = useMemo(
    () =>
      new Map(
        items.map((item) => [item.name.trim().toLowerCase(), item]),
      ),
    [],
  );

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Items"
        title={`All items (${items.length})`}
        description="Browse the full item database by general category and comfort-boost tags."
      >
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search items"
            className="type-ui rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
          />
          <select
            value={generalCategory}
            onChange={(event) => setGeneralCategory(event.target.value)}
            className="type-ui rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
          >
            <option value="all">All general categories</option>
            {generalCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {toLabel(category)}
              </option>
            ))}
          </select>
          <select
            value={comfortCategory}
            onChange={(event) => setComfortCategory(event.target.value)}
            className="type-ui rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
          >
            <option value="all">All comfort tags</option>
            {comfortItemCategoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Results" title={`${filteredItems.length} items`}>
        <div className="space-y-6">
          {itemsByCategory.map(([categoryLabel, categoryItems]) => (
            <section key={categoryLabel} className="space-y-3">
              <h3 className="type-overline text-ink/65">{categoryLabel}</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className="rounded-[1.6rem] border border-white/70 bg-white/75 p-4 text-left transition hover:border-moss/35 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="type-h3 text-ink">{item.name}</h3>
                        <p className="type-caption mt-1 text-ink/65">{item.itemCategoryLabel ?? "Unknown"}</p>
                      </div>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl bg-white object-contain p-1" />
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.comfortCategoryLabels.map((tag) => (
                        <Chip key={`${item.id}-${tag}`} tone="warning">
                          {tag}
                        </Chip>
                      ))}
                      {item.favoriteCategoryIds.slice(0, 3).map((categoryId) => (
                        <Chip key={`${item.id}-${categoryId}`}>{favoriteCategoryById.get(categoryId)?.name ?? categoryId}</Chip>
                      ))}
                    </div>

                    <p className="type-caption mt-3 text-ink/55">Tap for details</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </SectionCard>

      {selectedItem ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-3 md:items-center" onClick={() => setSelectedItemId(null)}>
          <section
            className="max-h-[88vh] w-full max-w-[760px] overflow-auto rounded-[1.8rem] border border-white/70 bg-paper p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="type-overline text-moss/60">Item Details</p>
                <h3 className="type-h2 mt-1 text-ink">{selectedItem.name}</h3>
                <p className="type-caption mt-1 text-ink/65">{selectedItem.itemCategoryLabel ?? "Unknown"}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemId(null)}
                className="type-ui rounded-full border border-ink/10 bg-white/90 px-3 py-1 text-ink/80"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-ink/8 bg-white/80 p-3">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="h-32 w-full rounded-xl bg-white object-contain p-2"
                  />
                ) : null}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="type-ui type-ui-strong text-ink/75">Comfort tags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedItem.comfortCategoryLabels.length > 0 ? (
                      selectedItem.comfortCategoryLabels.map((tag) => (
                        <Chip key={`${selectedItem.id}-tag-${tag}`} tone="warning">
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
                    {selectedItem.favoriteCategoryIds.length > 0 ? (
                      selectedItem.favoriteCategoryIds.map((categoryId) => {
                        const categoryName = favoriteCategoryById.get(categoryId)?.name ?? categoryId;
                        return (
                          <Link key={`${selectedItem.id}-fav-${categoryId}`} to={`/lookup?favoriteCategoryId=${encodeURIComponent(categoryId)}`}>
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

            {selectedItem.materials.length > 0 ? (
              <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
                <p className="type-ui type-ui-strong text-ink/75">Materials required</p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {selectedItem.materials.map((material) => {
                    const materialItem = itemByName.get(material.itemName.trim().toLowerCase()) ?? null;
                    return (
                      <li key={`${selectedItem.id}-${material.itemName}`}>
                        {materialItem ? (
                          <button
                            type="button"
                            onClick={() => setSelectedItemId(materialItem.id)}
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
                          </button>
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

            <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
              <p className="type-ui type-ui-strong text-ink/75">Source notes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedItem.sources.length > 0 ? (
                  selectedItem.sources.map((source) => <Chip key={`${selectedItem.id}-${source.type}-${source.label}`}>{source.label}</Chip>)
                ) : (
                  <p className="type-caption text-ink/55">No source notes listed.</p>
                )}
              </div>
            </div>

            {habitatsForSelectedItem.length > 0 ? (
              <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
                <p className="type-ui type-ui-strong text-ink/75">Used in habitats</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {habitatsForSelectedItem.map((habitat) => (
                    <Link
                      key={`${selectedItem.id}-habitat-${habitat.id}`}
                      to={`/habitats?query=${encodeURIComponent(habitat.name)}`}
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

            {recipesUsingSelectedItem.length > 0 ? (
              <div className="mt-4 rounded-xl border border-ink/8 bg-white/70 p-4">
                <p className="type-ui type-ui-strong text-ink/75">Used in recipes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recipesUsingSelectedItem.map((item) => (
                    <button
                      key={`${selectedItem.id}-recipe-${item.id}`}
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-left transition hover:border-moss/35"
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-5 w-5 rounded-full bg-white object-contain p-0.5" />
                      ) : null}
                      <span className="type-caption text-ink/80">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
};

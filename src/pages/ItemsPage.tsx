import { useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Chip } from "../components/common/Chip";
import { SectionCard } from "../components/common/SectionCard";
import { favoriteCategoryById } from "../data/favoriteCategories";
import { comfortItemCategoryOptions, items } from "../data/items";

const toLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const ItemsPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const generalCategory = searchParams.get("generalCategory") ?? "all";
  const comfortCategory = searchParams.get("comfortCategory") ?? "all";

  const updateSearchParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (key === "q" && value.trim().length === 0) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

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

  const fromPath = `/items${location.search}`;

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
            onChange={(event) => updateSearchParam("q", event.target.value)}
            placeholder="Search items"
            className="type-ui rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
          />
          <select
            value={generalCategory}
            onChange={(event) => updateSearchParam("generalCategory", event.target.value)}
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
            onChange={(event) => updateSearchParam("comfortCategory", event.target.value)}
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
                  <Link
                    key={item.id}
                    to={{
                      pathname: `/items/${item.id}`,
                      search: `?from=${encodeURIComponent(fromPath)}`,
                    }}
                    state={{ backgroundLocation: location, modal: true }}
                    className="card-shell block rounded-[1.6rem] p-4 text-left transition"
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

                    {item.obtainabilityDetails && item.obtainabilityDetails.length > 0 ? (
                      <p className="type-caption mt-2 text-ink/62">{item.obtainabilityDetails[0]}</p>
                    ) : null}

                    <p className="type-caption mt-3 text-ink/55">Tap for details</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

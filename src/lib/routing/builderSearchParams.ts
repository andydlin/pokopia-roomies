import type { BrowseTab, BuilderBrowseState, ItemBrowseIntent } from "../../domain/home-builder/models";

export const tabPathByTab: Record<BrowseTab, string> = {
  pokemon: "/builder/pokemon",
  items: "/builder/items/comfort",
  favorites: "/builder/favorites",
  habitats: "/builder/habitats",
};

export const tabFromPathname = (pathname: string): BrowseTab => {
  if (pathname.includes("/builder/items")) return "items";
  if (pathname.includes("/builder/favorites")) return "favorites";
  if (pathname.includes("/builder/habitats")) return "habitats";
  return "pokemon";
};

export const itemPhaseFromPathname = (pathname: string): "comfort" | "other" => (
  pathname.includes("/builder/items/other") ? "other" : "comfort"
);

const normalizeMode = (value: string | null) => (value === "contextual" || value === "all" ? value : undefined);

const normalizeIntent = (value: string | null): ItemBrowseIntent => {
  if (!value) return null;
  if (value === "best_fit" || value === "missing_categories" || value === "all_items") return value;
  return null;
};

export const applySearchParamsToBrowseState = (
  browse: BuilderBrowseState,
  pathname: string,
  searchParams: URLSearchParams,
): BuilderBrowseState => {
  const activeTab = tabFromPathname(pathname);
  const query = searchParams.get("q") ?? "";
  const mode = normalizeMode(searchParams.get("mode"));
  const detail = searchParams.get("detail");

  const next: BuilderBrowseState = {
    ...browse,
    activeTab,
  };

  if (activeTab === "items") {
    next.items = {
      ...next.items,
      searchQuery: query,
      browseMode: mode ?? next.items.browseMode,
      intent: normalizeIntent(searchParams.get("intent")),
      generalCategoryId: searchParams.get("generalCategory"),
      comfortCategoryId: searchParams.get("comfortCategory"),
      favoriteCategoryId: searchParams.get("favoriteCategory"),
      detailItemId: detail,
    };
  }

  if (activeTab === "pokemon") {
    next.pokemon = {
      ...next.pokemon,
      searchQuery: query,
      browseMode: mode ?? next.pokemon.browseMode,
      typeId: searchParams.get("type"),
      favoriteCategoryId: searchParams.get("favoriteCategory"),
      habitatId: searchParams.get("habitat"),
      detailPokemonId: detail,
    };
  }

  if (activeTab === "favorites") {
    next.favorites = {
      ...next.favorites,
      searchQuery: query,
      browseMode: mode ?? next.favorites.browseMode,
      favoriteCategoryId: searchParams.get("favoriteCategory"),
    };
    next.items = {
      ...next.items,
      detailItemId: detail,
    };
  }

  if (activeTab === "habitats") {
    next.habitats = {
      ...next.habitats,
      searchQuery: query,
      browseMode: mode ?? next.habitats.browseMode,
      detailHabitatId: detail,
    };
  }

  return next;
};

export const buildSearchParamsFromBrowseState = (browse: BuilderBrowseState): URLSearchParams => {
  const params = new URLSearchParams();

  if (browse.activeTab === "items") {
    if (browse.items.searchQuery) params.set("q", browse.items.searchQuery);
    if (browse.items.browseMode) params.set("mode", browse.items.browseMode);
    if (browse.items.intent) params.set("intent", browse.items.intent);
    if (browse.items.generalCategoryId) params.set("generalCategory", browse.items.generalCategoryId);
    if (browse.items.comfortCategoryId) params.set("comfortCategory", browse.items.comfortCategoryId);
    if (browse.items.favoriteCategoryId) params.set("favoriteCategory", browse.items.favoriteCategoryId);
    if (browse.items.detailItemId) params.set("detail", browse.items.detailItemId);
  }

  if (browse.activeTab === "pokemon") {
    if (browse.pokemon.searchQuery) params.set("q", browse.pokemon.searchQuery);
    if (browse.pokemon.browseMode) params.set("mode", browse.pokemon.browseMode);
    if (browse.pokemon.typeId) params.set("type", browse.pokemon.typeId);
    if (browse.pokemon.favoriteCategoryId) params.set("favoriteCategory", browse.pokemon.favoriteCategoryId);
    if (browse.pokemon.habitatId) params.set("habitat", browse.pokemon.habitatId);
    if (browse.pokemon.detailPokemonId) params.set("detail", browse.pokemon.detailPokemonId);
  }

  if (browse.activeTab === "favorites") {
    if (browse.favorites.searchQuery) params.set("q", browse.favorites.searchQuery);
    if (browse.favorites.browseMode) params.set("mode", browse.favorites.browseMode);
    if (browse.favorites.favoriteCategoryId) params.set("favoriteCategory", browse.favorites.favoriteCategoryId);
    if (browse.items.detailItemId) params.set("detail", browse.items.detailItemId);
  }

  if (browse.activeTab === "habitats") {
    if (browse.habitats.searchQuery) params.set("q", browse.habitats.searchQuery);
    if (browse.habitats.browseMode) params.set("mode", browse.habitats.browseMode);
    if (browse.habitats.detailHabitatId) params.set("detail", browse.habitats.detailHabitatId);
  }

  return params;
};

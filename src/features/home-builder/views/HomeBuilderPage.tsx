import { type KeyboardEvent, type ReactNode, type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, Cube01, Grid01 } from "@untitledui/icons";
import { favoriteCategories, favoriteCategoryById } from "../../../data/favoriteCategories";
import { habitatTraits } from "../../../domain/data";
import {
  selectBuildMaterialsSummary,
  selectComfortItems,
  selectFavoriteItemSections,
  selectFilteredRankedItems,
  selectHomeSummary,
  selectItemFavoriteCategoryOptions,
  selectNonComfortItemsExcludingMaterials,
  selectPokemonBrowserSections,
} from "../../../domain/home-builder/selectors";
import {
  getBuildItemEntries,
  getBuildMaterialProgressEntries,
  getBuildProgressSummary,
  getBuildRecipeStatusBreakdown,
  getHighlightedItemIdsForMaterial,
  getHoveredItemMaterialIds,
} from "../../../domain/home-builder/materialPlanning";
import type { BrowseTab } from "../../../domain/home-builder/models";
import {
  applySearchParamsToBrowseState,
  buildSearchParamsFromBrowseState,
  itemPhaseFromPathname,
  tabPathByTab,
} from "../../../lib/routing/builderSearchParams";
import { Chip } from "../../../components/common/Chip";
import { Tooltip } from "../../../components/common/Tooltip";
import { BuilderSearchField, FavoritesToggle, SortSegmentedControl } from "../../../components/home-builder/BuilderControls";
import { ResultCardShell, ResultCardTitle } from "../../../components/home-builder/ResultCardShell";
import { OverlapTooltip } from "../../../components/home-builder/BuilderTooltip";
import { SidebarPokemonCard } from "../../../components/home-builder/SidebarPokemonCard";
import { BuilderResultsListSkeleton, BuilderResultsSkeleton, BuilderSidebarSkeleton } from "../../../components/home-builder/BuilderSkeletons";
import { ActiveFilterChips, type ActiveFilterChip, ResultsBrowserBar, ResultsContent, ResultCardImageWell, ResultCardOverflowWrapper, SeeAllToggle } from "../../../components/home-builder/BuilderBrowserComponents";
import { useHomeBuilder } from "../state/HomeBuilderContext";

const toCategoryLabel = (categoryId: string) =>
  favoriteCategories.find((entry) => entry.id === categoryId)?.name ??
  categoryId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
const toTypeLabel = (typeId: string) =>
  typeId
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const phaseTabs: Array<{ id: BuilderPhase; label: string }> = [
  { id: "pokemon", label: "Pokemon" },
  { id: "comfort_items", label: "Comfort Items" },
  { id: "extra_items", label: "Other Items" },
  { id: "review_materials", label: "Build Plan" },
];
const MAX_POKEMON_FAVORITES_TO_SHOW = 6;
const MAX_POKEMON_CARDS_PER_SECTION = 6;
const MAX_ITEM_CARDS_PER_SECTION = 6;
type PokemonSectionId = string;
type BuilderPhase = "pokemon" | "comfort_items" | "extra_items" | "review_materials";
type CompleteBuildSectionId = "summary" | "items" | "materials" | "coverage";
const TAB_TRANSITION_MS = 200;
const INITIAL_SKELETON_MIN_MS = 300;
const RESULTS_REFRESH_SKELETON_MIN_MS = 180;
const HOME_BUILDER_SESSION_STORAGE_KEY = "pokopia.home-builder.session.v1";
const SHOW_FAVORITES_STORAGE_KEY = "pokopia:builder:show-favorites";
const SHOW_FAVORITES_BY_TAB_STORAGE_KEY = "pokopia:builder:show-favorites-by-tab";
const SORT_MODE_BY_TAB_STORAGE_KEY = "pokopia:builder:sort-mode-by-tab";
const EXCLUDED_ITEMS_PAGE_MAIN_CATEGORIES = new Set(["Materials", "Food"]);
const PHASE_TO_TAB: Record<BuilderPhase, BrowseTab> = {
  pokemon: "pokemon",
  comfort_items: "items",
  extra_items: "items",
  review_materials: "favorites",
};
const PHASE_TO_PATHNAME: Record<BuilderPhase, string> = {
  pokemon: "/builder/pokemon",
  comfort_items: "/builder/items/comfort",
  extra_items: "/builder/items/other",
  review_materials: "/builder/favorites",
};

const activateWithKeyboard = (
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
};

const PokeBallIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path d="M3.5 12a8.5 8.5 0 0 1 17 0" stroke="currentColor" strokeWidth="1.8" />
    <path d="M20.5 12a8.5 8.5 0 0 1-17 0" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 12h5.2m6.6 0h5.2" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const CollapsibleResultsSection = ({
  title,
  count,
  description,
  isCollapsed,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  description?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => (
  <section className="space-y-3 rounded-[var(--pk-radius-lg)] border border-[var(--pk-border)] bg-[var(--pk-card)] p-4">
    <div className="inline-flex items-center gap-2 text-left">
      <h3 className="text-sm font-semibold leading-none text-[var(--pk-text-primary)]">{title}</h3>
      <span
        className={`pk-chip pk-chip-standard ${
          title === "Best Matches"
            ? "pk-chip-best"
            : title === "Some Overlap"
              ? "pk-chip-some"
              : title === "No Overlap"
                ? "pk-chip-none"
                : "pk-chip-primary"
        }`}
      >
        {count}
      </span>
    </div>
    {!isCollapsed ? (
      <>
        {description ? <p className="text-xs italic text-[var(--pk-text-desc)]">{description}</p> : null}
        {children}
      </>
    ) : null}
  </section>
);

// Component: Custom multi-select dropdown with "All" behavior
const CustomMultiSelect = ({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const toggleOption = (id: string) => {
    const nextSet = new Set(selectedSet);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    onChange([...nextSet]);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-2 rounded-[8px] bg-[#d4e5ec] px-3 py-1.5 text-sm font-medium text-[#6c889b]"
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 text-[#7d8f98] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="no-scrollbar absolute left-0 top-[calc(100%+6px)] z-30 min-w-[180px] max-h-[320px] overflow-y-auto rounded-[10px] border border-[#dfe3e8] bg-white p-2 shadow-[0_8px_20px_rgba(16,24,40,0.08)]">
          <label className="mb-1 flex cursor-pointer items-center gap-2 rounded-[6px] px-1.5 py-1 hover:bg-[#f7f8fa]">
            <input
              type="checkbox"
              checked={selectedIds.length === 0}
              onChange={() => onChange([])}
              className="h-3.5 w-3.5 accent-[#7F56D9]"
            />
            <span className="text-xs text-[#475467]">All</span>
          </label>
          {options.map((option) => (
            <label key={option.id} className="mb-1 flex cursor-pointer items-center gap-2 rounded-[6px] px-1.5 py-1 hover:bg-[#f7f8fa]">
              <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-[#D0D5DD] bg-white">
                {selectedSet.has(option.id) ? <Check className="h-3 w-3 text-[#7F56D9]" /> : null}
                <input
                  type="checkbox"
                  checked={selectedSet.has(option.id)}
                  onChange={() => toggleOption(option.id)}
                  className="absolute inset-0 opacity-0"
                />
              </span>
              <span className="text-xs text-[#344054]">{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// Component: Custom single-select dropdown
const CustomSingleSelect = ({
  label,
  options,
  selectedId,
  onChange,
}: {
  label?: string;
  options: Array<{ id: string; label: string }>;
  selectedId: string;
  onChange: (next: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = options.find((option) => option.id === selectedId)?.label ?? label ?? "";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-[14px] bg-[#d4e5ec] px-4 text-base font-medium text-[#6c889b]"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`h-5 w-5 text-[#6c889b] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="no-scrollbar absolute left-0 top-[calc(100%+6px)] z-30 min-w-[220px] max-h-[240px] overflow-y-auto rounded-[10px] border border-[#dfe3e8] bg-white p-2 shadow-[0_8px_20px_rgba(16,24,40,0.08)]">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className="mb-1 flex w-full items-center gap-2 rounded-[6px] px-1.5 py-1 text-left hover:bg-[#f7f8fa]"
            >
              <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-[#D0D5DD] bg-white">
                {selectedId === option.id ? <Check className="h-3 w-3 text-[#7F56D9]" /> : null}
              </span>
              <span className="text-xs text-[#344054]">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// Component: Item details overlay
const ItemDetailOverlay = ({
  itemId,
  onClose,
  onOpenItemDetail,
  breadcrumbItemIds,
}: {
  itemId: string;
  onClose: () => void;
  onOpenItemDetail: (itemId: string) => void;
  breadcrumbItemIds: string[];
}) => {
  const { entities, dispatch } = useHomeBuilder();
  const item = entities.itemsById[itemId];

  if (!item) return null;

  const normalizeName = (value: string) => value.trim().toLowerCase();
  const itemIdByNormalizedName = new Map(
    entities.allItemIds.map((candidateId) => [normalizeName(entities.itemsById[candidateId].name), candidateId]),
  );
  const requiredByRecipes = entities.allItemIds
    .map((candidateId) => entities.itemsById[candidateId])
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => {
      const totalRequired = candidate.materials
        .filter((material) => normalizeName(material.itemName) === normalizeName(item.name))
        .reduce((sum, material) => sum + material.quantity, 0);
      return {
        item: candidate,
        totalRequired,
      };
    })
    .filter((entry) => entry.totalRequired > 0)
    .sort((left, right) => left.item.name.localeCompare(right.item.name));

  const habitatsUsingItem = entities.allHabitatIds
    .map((habitatId) => entities.habitatsById[habitatId])
    .filter((habitat) => habitat.requiredItems.some((requiredItem) => requiredItem.itemId === itemId));
  const sourceLabels = [
    ...new Set([
      ...item.obtainabilityDetails,
      ...item.sources.map((source) => source.label).filter(Boolean),
    ]),
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 md:items-center" onClick={onClose}>
      <section
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="type-overline text-moss/60">Item details</p>
            <h3 className="type-h2 mt-1 text-ink">{item.name}</h3>
            <p className="type-caption text-ink/65">{item.generalCategoryLabel}</p>
          </div>
          <button type="button" onClick={onClose} className="pk-btn pk-btn-secondary pk-btn-sm">
            Back to results
          </button>
        </div>
        {breadcrumbItemIds.length > 1 ? (
          <nav className="mt-3 flex flex-wrap items-center gap-1">
            {breadcrumbItemIds.map((breadcrumbItemId, index) => {
              const breadcrumbItem = entities.itemsById[breadcrumbItemId];
              const isCurrent = breadcrumbItemId === item.id;
              if (!breadcrumbItem) return null;

              return (
                <span key={`${item.id}-breadcrumb-${breadcrumbItemId}`} className="inline-flex items-center gap-1">
                  {isCurrent ? (
                    <span className="type-caption rounded-full border border-ink/10 bg-paper px-2 py-0.5 text-ink">
                      {breadcrumbItem.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenItemDetail(breadcrumbItemId)}
                      className="pk-btn pk-btn-ghost pk-btn-sm type-caption"
                    >
                      {breadcrumbItem.name}
                    </button>
                  )}
                  {index < breadcrumbItemIds.length - 1 ? <span className="type-caption text-ink/45">/</span> : null}
                </span>
              );
            })}
          </nav>
        ) : null}
        <div className="mt-4 space-y-4">
          <div>
            <p className="type-ui type-ui-strong text-ink/75">Item image</p>
            {item.image ? (
              <img src={item.image} alt={item.name} className="mt-2 h-28 w-28 rounded-xl bg-paper object-contain p-1" />
            ) : (
              <div className="type-caption mt-2 inline-flex h-28 w-28 items-center justify-center rounded-xl border border-ink/10 bg-paper text-ink/60">
                No image
              </div>
            )}
          </div>
          {item.comfortCategoryIds.length > 0 ? (
            <div>
              <p className="type-ui type-ui-strong text-ink/75">Comfort tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.comfortCategoryIds.map((categoryId) => (
                  <Chip key={categoryId}>{toCategoryLabel(categoryId)}</Chip>
                ))}
              </div>
            </div>
          ) : null}
          {item.craftable && item.materials.length > 0 ? (
            <div>
              <p className="type-ui type-ui-strong text-ink/75">Recipe</p>
              <ul className="mt-2 space-y-1">
                {item.materials.map((material) => (
                  <li key={`${item.id}-${material.itemName}`} className="type-caption text-ink/70">
                    {(() => {
                      const materialItemId = itemIdByNormalizedName.get(normalizeName(material.itemName));
                      const materialItem = materialItemId ? entities.itemsById[materialItemId] : null;
                      return materialItemId ? (
                        <button
                          type="button"
                          onClick={() => onOpenItemDetail(materialItemId)}
                          className="pk-btn pk-btn-ghost pk-btn-sm items-center gap-2 text-left"
                        >
                          {materialItem?.image ? (
                            <img src={materialItem.image} alt={material.itemName} className="h-5 w-5 rounded bg-paper object-contain p-0.5" />
                          ) : null}
                          {material.itemName} x{material.quantity}
                        </button>
                      ) : (
                        `${material.itemName} x${material.quantity}`
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {requiredByRecipes.length > 0 ? (
            <div>
              <p className="type-ui type-ui-strong text-ink/75">Used in recipes</p>
              <ul className="mt-2 flex max-h-82 flex-wrap gap-2 overflow-y-auto pr-1">
                {requiredByRecipes.map((entry) => (
                  <li key={`${item.id}-required-by-${entry.item.id}`} className="type-caption text-ink/70">
                    <button
                      type="button"
                      onClick={() => onOpenItemDetail(entry.item.id)}
                      className="pk-btn pk-btn-ghost pk-btn-sm items-center gap-2 text-left"
                    >
                      {entry.item.image ? (
                        <img src={entry.item.image} alt={entry.item.name} className="h-5 w-5 rounded bg-paper object-contain p-0.5" />
                      ) : null}
                      {entry.item.name} x{entry.totalRequired}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {sourceLabels.length > 0 ? (
            <div>
              <p className="type-ui type-ui-strong text-ink/75">Where to find</p>
              <ul className="mt-2 space-y-1">
                {sourceLabels.map((sourceLabel) => (
                  <li key={`${item.id}-source-${sourceLabel}`} className="type-caption text-ink/70">
                    {sourceLabel}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {habitatsUsingItem.length > 0 ? (
            <div>
              <p className="type-ui type-ui-strong text-ink/75">Used in habitats</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {habitatsUsingItem.map((habitat) => {
                  const requirement = habitat.requiredItems.find((requiredItem) => requiredItem.itemId === item.id);
                  return <Chip key={`${item.id}-habitat-${habitat.id}`}>{`${habitat.name}${requirement ? ` x${requirement.quantity}` : ""}`}</Chip>;
                })}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => dispatch({ type: "home/add-item", itemId: item.id })}
            className="pk-btn pk-btn-secondary pk-btn-sm"
          >
            Add to Home
          </button>
        </div>
      </section>
    </div>
  );
};

// Component: Pokemon details overlay
const PokemonDetailOverlay = ({ pokemonId, onClose }: { pokemonId: string; onClose: () => void }) => {
  const { entities, dispatch } = useHomeBuilder();
  const pokemon = entities.pokemonById[pokemonId];
  if (!pokemon) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 md:items-center" onClick={onClose}>
      <section
        className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="type-overline text-moss/60">Pokemon details</p>
            <h3 className="type-h2 mt-1 text-ink">{pokemon.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="pk-btn pk-btn-secondary pk-btn-sm">
            Back to results
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {pokemon.imageUrl ? <img src={pokemon.imageUrl} alt={pokemon.name} className="h-28 w-28 rounded-xl bg-paper object-contain p-1" /> : null}
          <div className="flex flex-wrap gap-2">
            {pokemon.favoriteCategoryIds.map((categoryId) => (
              <Chip key={categoryId}>{toCategoryLabel(categoryId)}</Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "home/add-pokemon", pokemonId: pokemon.id })}
            className="pk-btn pk-btn-secondary pk-btn-sm"
          >
            Add to Home
          </button>
        </div>
      </section>
    </div>
  );
};

// Component: Habitat details overlay
const HabitatDetailOverlay = ({ habitatId, onClose }: { habitatId: string; onClose: () => void }) => {
  const { entities, dispatch } = useHomeBuilder();
  const habitat = entities.habitatsById[habitatId];
  if (!habitat) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 md:items-center" onClick={onClose}>
      <section
        className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="type-overline text-moss/60">Habitat details</p>
            <h3 className="type-h2 mt-1 text-ink">{habitat.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="pk-btn pk-btn-secondary pk-btn-sm">
            Back to results
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {habitat.image ? <img src={habitat.image} alt={habitat.name} className="h-28 w-28 rounded-xl bg-paper object-cover" /> : null}
          <button
            type="button"
            onClick={() => dispatch({ type: "home/set-habitat", habitatId: habitat.id })}
            className="pk-btn pk-btn-primary pk-btn-sm"
          >
            Select Habitat
          </button>
        </div>
      </section>
    </div>
  );
};

// Component: Unified Home Builder page
export const HomeBuilderPage = () => {
  const {
    state,
    localSaveStatus,
    lastLocalSaveAt,
    entities,
    dispatch,
    setBrowseStateFromRoute,
    saveCurrentHomeAsNew,
    generateRestoreCode,
    restoreFromCode,
  } = useHomeBuilder();
  const location = useLocation();
  const navigate = useNavigate();
  const browseStateRef = useRef(state.browse);

  const [restoreCodeInput, setRestoreCodeInput] = useState("");
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("replace");
  const [itemDetailTrail, setItemDetailTrail] = useState<string[]>([]);
  const [isSummaryPokemonExpanded, setIsSummaryPokemonExpanded] = useState(false);
  const [isSidebarFavoritesExpanded, setIsSidebarFavoritesExpanded] = useState(false);
  const [collapsedPokemonSectionIds, setCollapsedPokemonSectionIds] = useState<PokemonSectionId[]>([]);
  const [expandedPokemonSectionIds, setExpandedPokemonSectionIds] = useState<PokemonSectionId[]>([]);
  const [collapsingPokemonSectionIds, setCollapsingPokemonSectionIds] = useState<PokemonSectionId[]>([]);
  const [enteringPokemonSectionIds, setEnteringPokemonSectionIds] = useState<PokemonSectionId[]>([]);
  const [collapsedItemSectionIds, setCollapsedItemSectionIds] = useState<string[]>([]);
  const [expandedItemSectionIds, setExpandedItemSectionIds] = useState<string[]>([]);
  const [collapsingItemSectionIds, setCollapsingItemSectionIds] = useState<string[]>([]);
  const [enteringItemSectionIds, setEnteringItemSectionIds] = useState<string[]>([]);
  const [activePokemonFavoriteFilters, setActivePokemonFavoriteFilters] = useState<string[]>([]);
  const [activePokemonHabitatFilters, setActivePokemonHabitatFilters] = useState<string[]>([]);
  const [activeComfortFavoriteFilters, setActiveComfortFavoriteFilters] = useState<string[]>([]);
  const [activeItemPokemonFilterId, setActiveItemPokemonFilterId] = useState<string | null>(null);
  const pokemonSortMode = "suggested" as const;
  const itemSortMode = "suggested" as const;
  const [showFavoritesByTab, setShowFavoritesByTab] = useState<Record<"pokemon" | "items" | "favorites", boolean>>(() => {
    if (typeof window === "undefined") {
      return {
        pokemon: false,
        items: false,
        favorites: false,
      };
    }
    try {
      const storedByTab = window.localStorage.getItem(SHOW_FAVORITES_BY_TAB_STORAGE_KEY);
      if (storedByTab) {
        const parsed = JSON.parse(storedByTab) as Partial<Record<"pokemon" | "items" | "favorites", boolean>>;
        return {
          pokemon: Boolean(parsed.pokemon),
          items: Boolean(parsed.items),
          favorites: Boolean(parsed.favorites),
        };
      }
      const legacy = window.localStorage.getItem(SHOW_FAVORITES_STORAGE_KEY) === "true";
      return {
        pokemon: legacy,
        items: legacy,
        favorites: legacy,
      };
    } catch {
      return {
        pokemon: false,
        items: false,
        favorites: false,
      };
    }
  });
  const [expandedResultPokemonIds, setExpandedResultPokemonIds] = useState<string[]>([]);
  const [expandedResultItemIds, setExpandedResultItemIds] = useState<string[]>([]);
  const [expandedCoveragePokemonIds, setExpandedCoveragePokemonIds] = useState<Set<string>>(new Set());
  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<Partial<Record<BuilderPhase, HTMLButtonElement | null>>>({
    pokemon: null,
    comfort_items: null,
    extra_items: null,
  });
  const [activeTabIndicator, setActiveTabIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [, setVisualActiveTab] = useState<BrowseTab>(state.browse.activeTab === "pokemon" ? "pokemon" : "items");
  const [contentActiveTab, setContentActiveTab] = useState<BrowseTab>(state.browse.activeTab);
  const [activePhase, setActivePhase] = useState<BuilderPhase>(() => {
    if (state.browse.activeTab === "pokemon") return "pokemon";
    if (state.browse.activeTab === "favorites") return "review_materials";
    return itemPhaseFromPathname(location.pathname) === "other" ? "extra_items" : "comfort_items";
  });
  const [isTabTransitionLoading, setIsTabTransitionLoading] = useState(false);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !window.localStorage.getItem(HOME_BUILDER_SESSION_STORAGE_KEY);
    } catch {
      return true;
    }
  });
  const [isResultsRefreshing, setIsResultsRefreshing] = useState(false);
  const pendingTabRef = useRef<BrowseTab | null>(null);
  const tabTransitionTimerRef = useRef<number | null>(null);
  const pendingPhaseRef = useRef<BuilderPhase | null>(null);
  const collapseTimersRef = useRef<Partial<Record<PokemonSectionId, number>>>({});
  const enterTimersRef = useRef<Partial<Record<PokemonSectionId, number>>>({});
  const itemCollapseTimersRef = useRef<Partial<Record<string, number>>>({});
  const itemEnterTimersRef = useRef<Partial<Record<string, number>>>({});
  const itemFilterSectionStateRef = useRef<{ expanded: string[]; collapsed: string[] } | null>(null);
  const lastAppliedComfortFilterKeyRef = useRef<string>("");
  const refreshSkeletonTimerRef = useRef<number | null>(null);
  const lastResultsRefreshKeyRef = useRef<string | null>(null);
  const builderHeaderRef = useRef<HTMLDivElement | null>(null);
  const builderTitleRef = useRef<HTMLElement | null>(null);
  const resultsPaneRef = useRef<HTMLDivElement | null>(null);
  const completeBuildSummaryRef = useRef<HTMLElement | null>(null);
  const completeBuildItemsRef = useRef<HTMLElement | null>(null);
  const completeBuildMaterialsRef = useRef<HTMLElement | null>(null);
  const completeBuildCoverageRef = useRef<HTMLElement | null>(null);
  const [activeCompleteBuildSection, setActiveCompleteBuildSection] = useState<CompleteBuildSectionId>("summary");

  const startResultsRefresh = () => {
    if (showInitialSkeleton) return;
    setIsResultsRefreshing(true);
    if (refreshSkeletonTimerRef.current) {
      window.clearTimeout(refreshSkeletonTimerRef.current);
    }
    refreshSkeletonTimerRef.current = window.setTimeout(() => {
      setIsResultsRefreshing(false);
      refreshSkeletonTimerRef.current = null;
    }, RESULTS_REFRESH_SKELETON_MIN_MS);
  };

  const scrollToCompleteBuildSection = (sectionId: CompleteBuildSectionId) => {
    const sectionRefById: Record<CompleteBuildSectionId, RefObject<HTMLElement | null>> = {
      summary: completeBuildSummaryRef,
      items: completeBuildItemsRef,
      materials: completeBuildMaterialsRef,
      coverage: completeBuildCoverageRef,
    };
    const targetRef = sectionRefById[sectionId];
    targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveCompleteBuildSection(sectionId);
  };

  useEffect(() => {
    browseStateRef.current = state.browse;
  }, [state.browse]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SHOW_FAVORITES_BY_TAB_STORAGE_KEY, JSON.stringify(showFavoritesByTab));
      window.localStorage.setItem(
        SHOW_FAVORITES_STORAGE_KEY,
        showFavoritesByTab.pokemon || showFavoritesByTab.items || showFavoritesByTab.favorites ? "true" : "false",
      );
    } catch {
      // Ignore storage errors (private mode/quota) and keep in-memory state.
    }
  }, [showFavoritesByTab]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        SORT_MODE_BY_TAB_STORAGE_KEY,
        JSON.stringify({
          pokemon: pokemonSortMode,
          items: itemSortMode,
        }),
      );
    } catch {
      // Ignore storage errors (private mode/quota) and keep in-memory state.
    }
  }, [itemSortMode, pokemonSortMode]);

  useEffect(() => {
    if (!showInitialSkeleton) return;
    const timeout = window.setTimeout(() => setShowInitialSkeleton(false), INITIAL_SKELETON_MIN_MS);
    return () => window.clearTimeout(timeout);
  }, [showInitialSkeleton]);

  const resultsRefreshKey = useMemo(
    () =>
      JSON.stringify({
        tab: contentActiveTab,
        phase: activePhase,
        itemSortMode,
        pokemonSortMode,
        itemsSearch: state.browse.items.searchQuery,
        pokemonSearch: state.browse.pokemon.searchQuery,
        favoritesSearch: state.browse.favorites.searchQuery,
        favoritesCategory: state.browse.favorites.favoriteCategoryId ?? null,
        activeComfortFavoriteFilters: [...activeComfortFavoriteFilters].sort(),
        activePokemonFavoriteFilters: [...activePokemonFavoriteFilters].sort(),
        activePokemonHabitatFilters: [...activePokemonHabitatFilters].sort(),
        activeItemPokemonFilterId,
      }),
    [
      activeComfortFavoriteFilters,
      activeItemPokemonFilterId,
      activePhase,
      activePokemonFavoriteFilters,
      activePokemonHabitatFilters,
      contentActiveTab,
      itemSortMode,
      pokemonSortMode,
      state.browse.favorites.favoriteCategoryId,
      state.browse.favorites.searchQuery,
      state.browse.items.searchQuery,
      state.browse.pokemon.searchQuery,
    ],
  );

  useEffect(() => {
    if (showInitialSkeleton) return;
    if (lastResultsRefreshKeyRef.current === null) {
      lastResultsRefreshKeyRef.current = resultsRefreshKey;
      return;
    }
    if (lastResultsRefreshKeyRef.current === resultsRefreshKey) return;
    lastResultsRefreshKeyRef.current = resultsRefreshKey;
    startResultsRefresh();
  }, [resultsRefreshKey, showInitialSkeleton]);

  const showFavoritesForContentTab =
    contentActiveTab === "pokemon"
      ? true
      : contentActiveTab === "favorites"
        ? showFavoritesByTab.favorites
        : true;
  const showSidebarDetails = true;
  const tabToPhase = (tab: BrowseTab, pathname: string): BuilderPhase => {
    if (pendingPhaseRef.current) return pendingPhaseRef.current;
    if (tab === "pokemon") return "pokemon";
    if (tab === "favorites") return "review_materials";
    return itemPhaseFromPathname(pathname) === "other" ? "extra_items" : "comfort_items";
  };
  useEffect(() => {
    if (pendingTabRef.current && state.browse.activeTab !== pendingTabRef.current) return;
    setVisualActiveTab(state.browse.activeTab === "pokemon" ? "pokemon" : "items");
    setContentActiveTab(state.browse.activeTab);
    setActivePhase(tabToPhase(state.browse.activeTab, location.pathname));
    setIsTabTransitionLoading(false);
    if (pendingTabRef.current === state.browse.activeTab) {
      pendingTabRef.current = null;
    }
    if (pendingPhaseRef.current) {
      pendingPhaseRef.current = null;
    }
  }, [location.pathname, state.browse.activeTab]);
  useEffect(
    () => () => {
      if (tabTransitionTimerRef.current) {
        window.clearTimeout(tabTransitionTimerRef.current);
        tabTransitionTimerRef.current = null;
      }
      (Object.values(collapseTimersRef.current) as Array<number | undefined>).forEach((timerId) => {
        if (timerId) window.clearTimeout(timerId);
      });
      (Object.values(enterTimersRef.current) as Array<number | undefined>).forEach((timerId) => {
        if (timerId) window.clearTimeout(timerId);
      });
      (Object.values(itemCollapseTimersRef.current) as Array<number | undefined>).forEach((timerId) => {
        if (timerId) window.clearTimeout(timerId);
      });
      (Object.values(itemEnterTimersRef.current) as Array<number | undefined>).forEach((timerId) => {
        if (timerId) window.clearTimeout(timerId);
      });
      if (refreshSkeletonTimerRef.current) {
        window.clearTimeout(refreshSkeletonTimerRef.current);
        refreshSkeletonTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    const currentBrowse = browseStateRef.current;
    const incoming = applySearchParamsToBrowseState(currentBrowse, location.pathname, new URLSearchParams(location.search));
    if (JSON.stringify(incoming) !== JSON.stringify(currentBrowse)) {
      setBrowseStateFromRoute(incoming);
    }
  }, [location.pathname, location.search, setBrowseStateFromRoute]);

  const commitTabChange = (tab: BrowseTab, phase?: BuilderPhase) => {
    dispatch({ type: "browse/set-tab", tab });
    const nextBrowse = {
      ...state.browse,
      activeTab: tab,
    };
    const nextSearch = buildSearchParamsFromBrowseState(nextBrowse).toString();
    const pathname = phase ? PHASE_TO_PATHNAME[phase] : tabPathByTab[tab];
    navigate(
      {
        pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  };
  const getTabTransitionDelayMs = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return TAB_TRANSITION_MS;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : TAB_TRANSITION_MS;
  };
  const goToPhase = (phase: BuilderPhase) => {
    const tab = PHASE_TO_TAB[phase];
    pendingPhaseRef.current = phase;
    setActivePhase(phase);
    setVisualActiveTab(tab === "pokemon" ? "pokemon" : "items");
    if (tabTransitionTimerRef.current) {
      window.clearTimeout(tabTransitionTimerRef.current);
      tabTransitionTimerRef.current = null;
    }
    const delayMs = getTabTransitionDelayMs();
    if (delayMs === 0) {
      pendingTabRef.current = null;
      setIsTabTransitionLoading(false);
      setContentActiveTab(tab);
      commitTabChange(tab, phase);
      return;
    }

    pendingTabRef.current = tab;
    setIsTabTransitionLoading(true);
    tabTransitionTimerRef.current = window.setTimeout(() => {
      setContentActiveTab(tab);
      setIsTabTransitionLoading(false);
      pendingTabRef.current = null;
      commitTabChange(tab, phase);
      tabTransitionTimerRef.current = null;
    }, delayMs);
  };

  const togglePokemonSectionExpansion = (sectionId: PokemonSectionId) => {
    const isExpanded = expandedPokemonSectionIds.includes(sectionId);
    if (!isExpanded) {
      setCollapsingPokemonSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
      const existingTimerId = collapseTimersRef.current[sectionId];
      if (existingTimerId) {
        window.clearTimeout(existingTimerId);
        delete collapseTimersRef.current[sectionId];
      }
      setEnteringPokemonSectionIds((previousIds) => (previousIds.includes(sectionId) ? previousIds : [...previousIds, sectionId]));
      setExpandedPokemonSectionIds((previousIds) => [...previousIds, sectionId]);
      const existingEnterTimerId = enterTimersRef.current[sectionId];
      if (existingEnterTimerId) window.clearTimeout(existingEnterTimerId);
      enterTimersRef.current[sectionId] = window.setTimeout(() => {
        setEnteringPokemonSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
        delete enterTimersRef.current[sectionId];
      }, 30);
      return;
    }

    setCollapsingPokemonSectionIds((previousIds) => (previousIds.includes(sectionId) ? previousIds : [...previousIds, sectionId]));
    const existingTimerId = collapseTimersRef.current[sectionId];
    if (existingTimerId) window.clearTimeout(existingTimerId);
    collapseTimersRef.current[sectionId] = window.setTimeout(() => {
      setExpandedPokemonSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
      setCollapsingPokemonSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
      delete collapseTimersRef.current[sectionId];
    }, 520);
  };

  const toggleItemSectionExpansion = (sectionId: string) => {
    const isExpanded = expandedItemSectionIds.includes(sectionId);
    if (!isExpanded) {
      setCollapsingItemSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
      const existingTimerId = itemCollapseTimersRef.current[sectionId];
      if (existingTimerId) {
        window.clearTimeout(existingTimerId);
        delete itemCollapseTimersRef.current[sectionId];
      }
      setEnteringItemSectionIds((previousIds) => (previousIds.includes(sectionId) ? previousIds : [...previousIds, sectionId]));
      setExpandedItemSectionIds((previousIds) => [...previousIds, sectionId]);
      const existingEnterTimerId = itemEnterTimersRef.current[sectionId];
      if (existingEnterTimerId) window.clearTimeout(existingEnterTimerId);
      itemEnterTimersRef.current[sectionId] = window.setTimeout(() => {
        setEnteringItemSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
        delete itemEnterTimersRef.current[sectionId];
      }, 30);
      return;
    }

    setCollapsingItemSectionIds((previousIds) => (previousIds.includes(sectionId) ? previousIds : [...previousIds, sectionId]));
    const existingTimerId = itemCollapseTimersRef.current[sectionId];
    if (existingTimerId) window.clearTimeout(existingTimerId);
    itemCollapseTimersRef.current[sectionId] = window.setTimeout(() => {
      setExpandedItemSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
      setCollapsingItemSectionIds((previousIds) => previousIds.filter((id) => id !== sectionId));
      delete itemCollapseTimersRef.current[sectionId];
    }, 520);
  };

  const setItemDetail = (itemId: string | null, options?: { pushHistory?: boolean; tab?: "items" | "favorites" }) => {
    dispatch({ type: "browse/items/set-detail", itemId });

    if (!itemId) {
      setItemDetailTrail([]);
    }

    const itemTab: "items" | "favorites" =
      options?.tab ?? (state.browse.activeTab === "favorites" ? "favorites" : "items");

    const nextBrowse = {
      ...state.browse,
      activeTab: itemTab,
      items: {
        ...state.browse.items,
        detailItemId: itemId,
      },
    };
    const nextSearch = buildSearchParamsFromBrowseState(nextBrowse).toString();

    navigate(
      {
        pathname: itemTab === "items"
          ? (activePhase === "comfort_items" || activePhase === "extra_items"
            ? PHASE_TO_PATHNAME[activePhase]
            : PHASE_TO_PATHNAME.comfort_items)
          : tabPathByTab[itemTab],
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: options?.pushHistory === false },
    );
  };

  const setPokemonDetail = (pokemonId: string | null, options?: { pushHistory?: boolean }) => {
    dispatch({ type: "browse/pokemon/set-detail", pokemonId });

    const nextBrowse = {
      ...state.browse,
      activeTab: "pokemon" as const,
      pokemon: {
        ...state.browse.pokemon,
        detailPokemonId: pokemonId,
      },
    };
    const nextSearch = buildSearchParamsFromBrowseState(nextBrowse).toString();

    navigate(
      {
        pathname: tabPathByTab.pokemon,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: options?.pushHistory === false },
    );
  };

  const homeSummary = useMemo(() => selectHomeSummary(state.currentHome, entities), [state.currentHome, entities]);
  const favoriteCategoryOptions = useMemo(() => selectItemFavoriteCategoryOptions(entities), [entities]);
  const comfortRankedItems = useMemo(
    () => selectComfortItems(state.currentHome, state.browse, entities),
    [state.currentHome, state.browse, entities],
  );
  const extraRankedItems = useMemo(
    () => selectNonComfortItemsExcludingMaterials(state.currentHome, state.browse, entities),
    [state.currentHome, state.browse, entities],
  );
  const itemCategories = useMemo(() => {
    const browseWithoutCategoryFilter = { ...state.browse, items: { ...state.browse.items, generalCategoryId: null } };
    const tabItems =
      activePhase === "extra_items"
        ? selectNonComfortItemsExcludingMaterials(state.currentHome, browseWithoutCategoryFilter, entities)
        : selectComfortItems(state.currentHome, browseWithoutCategoryFilter, entities);
    const seen = new Map<string, string>();
    tabItems.forEach((entry) => {
      if (!seen.has(entry.item.generalCategoryId)) seen.set(entry.item.generalCategoryId, entry.item.generalCategoryLabel);
    });
    return [...seen.entries()].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [state.currentHome, state.browse.items.searchQuery, state.browse.items.browseMode, state.browse.items.comfortCategoryId, state.browse.items.favoriteCategoryId, entities, activePhase]);
  const pokemonSections = useMemo(() => selectPokemonBrowserSections(state.currentHome, state.browse, entities), [state.currentHome, state.browse, entities]);
  const pokemonResultEntries = useMemo(
    () => [...pokemonSections.best, ...pokemonSections.supporting, ...pokemonSections.neutral],
    [pokemonSections.best, pokemonSections.supporting, pokemonSections.neutral],
  );
  const multiFilteredPokemonEntries = useMemo(() => pokemonResultEntries, [pokemonResultEntries]);
  const favoriteSections = useMemo(
    () => selectFavoriteItemSections(state.currentHome, state.browse, entities),
    [state.currentHome, state.browse, entities],
  );
  const totalFavoriteItems = useMemo(() => {
    const uniqueItemIds = new Set<string>();
    favoriteSections.forEach((section) => {
      section.items.forEach((entry) => uniqueItemIds.add(entry.item.id));
    });
    return uniqueItemIds.size;
  }, [favoriteSections]);

  const selectedPokemon = state.currentHome.pokemonIds.map((id) => entities.pokemonById[id]).filter(Boolean);
  const habitatTraitLabelById = useMemo(
    () =>
      new Map(
        habitatTraits.map((trait) => [trait.id, trait.label]),
      ),
    [],
  );
  const getPreferredHabitatLabel = (idealHabitatId: string | null) =>
    idealHabitatId
      ? entities.habitatsById[idealHabitatId]?.name ??
        habitatTraitLabelById.get(idealHabitatId) ??
        toTypeLabel(idealHabitatId)
      : "Unknown";
  const sharedFavoriteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedPokemon.forEach((pokemon) => {
      pokemon.favoriteCategoryIds.forEach((categoryId) => {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      });
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1] || toCategoryLabel(left[0]).localeCompare(toCategoryLabel(right[0])));
  }, [selectedPokemon]);
  const sharedFavoriteCountByCategoryId = useMemo(
    () => new Map(sharedFavoriteCounts),
    [sharedFavoriteCounts],
  );
  const selectedFavoriteOrderIndexByCategoryId = useMemo(() => {
    if (selectedPokemon.length === 0) return new Map<string, number>();

    const scoreByCategoryId = new Map<string, number>();
    selectedPokemon.forEach((pokemon, pokemonIndex) => {
      pokemon.favoriteCategoryIds.forEach((categoryId, favoriteIndex) => {
        const positionalScore = pokemonIndex * 100 + favoriteIndex;
        const currentBest = scoreByCategoryId.get(categoryId);
        if (currentBest === undefined || positionalScore < currentBest) {
          scoreByCategoryId.set(categoryId, positionalScore);
        }
      });
    });

    const orderedIds = [...scoreByCategoryId.entries()]
      .sort((left, right) => left[1] - right[1] || toCategoryLabel(left[0]).localeCompare(toCategoryLabel(right[0])))
      .map(([categoryId]) => categoryId);

    return new Map(orderedIds.map((categoryId, index) => [categoryId, index]));
  }, [selectedPokemon]);
  const sharedHabitatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedPokemon.forEach((pokemon) => {
      const habitatId = pokemon.idealHabitatId;
      if (!habitatId) return;
      counts.set(habitatId, (counts.get(habitatId) ?? 0) + 1);
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1] || getPreferredHabitatLabel(left[0]).localeCompare(getPreferredHabitatLabel(right[0])));
  }, [selectedPokemon]);
  const buildItemEntries = useMemo(() => getBuildItemEntries(state.currentHome, entities), [state.currentHome, entities]);
  const itemSatisfactionCountByPokemonId = useMemo(() => {
    const counts = new Map<string, number>(selectedPokemon.map((pokemon) => [pokemon.id, 0]));
    buildItemEntries.forEach((entry) => {
      if (entry.quantityInBuild <= 0) return;
      const itemFavoriteIdSet = new Set(entry.item.favoriteCategoryIds);
      selectedPokemon.forEach((pokemon) => {
        if (pokemon.favoriteCategoryIds.some((categoryId) => itemFavoriteIdSet.has(categoryId))) {
          counts.set(pokemon.id, (counts.get(pokemon.id) ?? 0) + entry.quantityInBuild);
        }
      });
    });
    return counts;
  }, [buildItemEntries, selectedPokemon]);
  const itemPokemonFilterOptions = useMemo(
    () => [
      { id: "all", label: "All Pokemon" },
      ...selectedPokemon.map((pokemon) => ({
        id: pokemon.id,
        label: `${pokemon.name} · ${itemSatisfactionCountByPokemonId.get(pokemon.id) ?? 0} items added`,
      })),
    ],
    [itemSatisfactionCountByPokemonId, selectedPokemon],
  );
  const activeItemPokemonFilter = useMemo(
    () => selectedPokemon.find((pokemon) => pokemon.id === activeItemPokemonFilterId) ?? null,
    [activeItemPokemonFilterId, selectedPokemon],
  );
  const buildMaterialsSummary = useMemo(() => selectBuildMaterialsSummary(state.currentHome, entities), [state.currentHome, entities]);
  const materialProgressEntries = buildMaterialsSummary.entries;
  const buildProgressSummary = buildMaterialsSummary.progress;
  const recipeStatusBreakdown = useMemo(
    () => getBuildRecipeStatusBreakdown(state.currentHome, entities),
    [state.currentHome, entities],
  );
  const highlightedItemIds = useMemo(
    () =>
      state.ui.activeMaterialHighlightId
        ? getHighlightedItemIdsForMaterial(state.currentHome, entities, state.ui.activeMaterialHighlightId)
        : new Set<string>(),
    [state.currentHome, entities, state.ui.activeMaterialHighlightId],
  );
  const hoveredMaterialIds = useMemo(
    () =>
      state.ui.hoveredBuildItemId
        ? getHoveredItemMaterialIds(state.currentHome, entities, state.ui.hoveredBuildItemId)
        : new Set<string>(),
    [state.currentHome, entities, state.ui.hoveredBuildItemId],
  );
  const totalItemQuantity = useMemo(
    () => buildItemEntries.reduce((sum, entry) => sum + entry.quantityInBuild, 0),
    [buildItemEntries],
  );
  const selectedHabitat = state.currentHome.habitatId ? entities.habitatsById[state.currentHome.habitatId] : null;
  const selectedPokemonFavoriteSets = useMemo(() => {
    const allSelectedFavoriteIds = new Set<string>();
    selectedPokemon.forEach((pokemon) => {
      pokemon.favoriteCategoryIds.forEach((categoryId) => allSelectedFavoriteIds.add(categoryId));
    });

    const excludingSelfByPokemonId = new Map<string, Set<string>>();
    selectedPokemon.forEach((pokemon) => {
      const favoriteIdsExcludingSelf = new Set<string>();
      selectedPokemon.forEach((otherPokemon) => {
        if (otherPokemon.id === pokemon.id) return;
        otherPokemon.favoriteCategoryIds.forEach((categoryId) => favoriteIdsExcludingSelf.add(categoryId));
      });
      excludingSelfByPokemonId.set(pokemon.id, favoriteIdsExcludingSelf);
    });

    return {
      allSelectedFavoriteIds,
      excludingSelfByPokemonId,
    };
  }, [selectedPokemon]);
  const selectedPokemonAllFavoriteCategoryIdSet = useMemo(() => {
    const allFavoriteCategoryIds = new Set<string>();
    selectedPokemon.forEach((pokemon) => {
      pokemon.favoriteCategoryIds.forEach((categoryId) => allFavoriteCategoryIds.add(categoryId));
    });
    return allFavoriteCategoryIds;
  }, [selectedPokemon]);
  const selectedPokemonSharedFavoriteCategoryIdSet = useMemo(
    () => new Set(sharedFavoriteCounts.filter(([, count]) => count > 1).map(([categoryId]) => categoryId)),
    [sharedFavoriteCounts],
  );
  const pokemonMatchStatsById = useMemo(() => {
    const selectedPokemonFavoriteIdsById = new Map(
      selectedPokemon.map((pokemon) => [pokemon.id, new Set(pokemon.favoriteCategoryIds)]),
    );
    const statsById = new Map<string, {
      groupMatchCount: number;
      individualMatchCount: number;
      totalOverlapCount: number;
      coverageCount: number;
      weightedScore: number;
    }>();

    multiFilteredPokemonEntries.forEach((entry) => {
      const overlapIds = entry.sharedFavorites;
      const groupMatchCount = overlapIds.filter(
        (categoryId) => selectedPokemon.length > 0 && (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) === selectedPokemon.length,
      ).length;
      const individualMatchCount = overlapIds.filter(
        (categoryId) => (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) >= 1 && (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) < selectedPokemon.length,
      ).length;
      const coverageCount = selectedPokemon.reduce((count, pokemon) => {
        const favoriteIdSet = selectedPokemonFavoriteIdsById.get(pokemon.id);
        if (!favoriteIdSet) return count;
        return count + (overlapIds.some((categoryId) => favoriteIdSet.has(categoryId)) ? 1 : 0);
      }, 0);
      const totalOverlapCount = overlapIds.length;
      const weightedScore =
        groupMatchCount * 10 +
        individualMatchCount * 2 +
        coverageCount * 2;

      statsById.set(entry.pokemon.id, {
        groupMatchCount,
        individualMatchCount,
        totalOverlapCount,
        coverageCount,
        weightedScore,
      });
    });

    return statsById;
  }, [multiFilteredPokemonEntries, selectedPokemon, sharedFavoriteCountByCategoryId]);
  const rankedPokemonEntries = useMemo(() => {
    if (selectedPokemon.length <= 1) return multiFilteredPokemonEntries;

    return [...multiFilteredPokemonEntries].sort((left, right) => {
      const leftStats = pokemonMatchStatsById.get(left.pokemon.id);
      const rightStats = pokemonMatchStatsById.get(right.pokemon.id);
      if (!leftStats || !rightStats) return left.pokemon.name.localeCompare(right.pokemon.name);

      if (rightStats.groupMatchCount !== leftStats.groupMatchCount) return rightStats.groupMatchCount - leftStats.groupMatchCount;
      if (rightStats.coverageCount !== leftStats.coverageCount) return rightStats.coverageCount - leftStats.coverageCount;
      if (rightStats.totalOverlapCount !== leftStats.totalOverlapCount) return rightStats.totalOverlapCount - leftStats.totalOverlapCount;
      if (rightStats.weightedScore !== leftStats.weightedScore) return rightStats.weightedScore - leftStats.weightedScore;
      if (right.preferredHabitatMatchCount !== left.preferredHabitatMatchCount) {
        return right.preferredHabitatMatchCount - left.preferredHabitatMatchCount;
      }
      return left.pokemon.name.localeCompare(right.pokemon.name);
    });
  }, [multiFilteredPokemonEntries, pokemonMatchStatsById, selectedPokemon.length]);
  const pokemonEntriesBySortMode = rankedPokemonEntries;
  const isPokemonFavoriteFilterActive = activePokemonFavoriteFilters.length > 0;
  const isPokemonHabitatFilterActive = activePokemonHabitatFilters.length > 0;
  const isPokemonFilterActive = isPokemonFavoriteFilterActive || isPokemonHabitatFilterActive;
  const favoriteFilteredRankedPokemonEntries = useMemo(() => {
    if (!isPokemonFilterActive) return pokemonEntriesBySortMode;
    const favoriteFilterSet = new Set(activePokemonFavoriteFilters);
    const habitatFilterSet = new Set(activePokemonHabitatFilters);
    return pokemonEntriesBySortMode.filter((entry) => {
      const matchesFavorite = !isPokemonFavoriteFilterActive ||
        entry.pokemon.favoriteCategoryIds.some((categoryId) => favoriteFilterSet.has(categoryId));
      const matchesHabitat =
        !isPokemonHabitatFilterActive ||
        (entry.pokemon.idealHabitatId !== null && habitatFilterSet.has(entry.pokemon.idealHabitatId));
      return matchesFavorite && matchesHabitat;
    });
  }, [
    activePokemonFavoriteFilters,
    activePokemonHabitatFilters,
    isPokemonFilterActive,
    isPokemonFavoriteFilterActive,
    isPokemonHabitatFilterActive,
    pokemonEntriesBySortMode,
  ]);
  const visiblePokemonSections = useMemo(() => {
    type PokemonResultsSection = { id: PokemonSectionId; title: string; entries: typeof multiFilteredPokemonEntries };
    if (isPokemonFilterActive) {
      return [{ id: "filtered", title: "Filtered results", entries: favoriteFilteredRankedPokemonEntries }];
    }
    if (selectedPokemon.length === 0) {
      return [{ id: "all", title: "All Pokemon", entries: favoriteFilteredRankedPokemonEntries }];
    }

    if (selectedPokemon.length === 1) {
      const noOverlapEntries = favoriteFilteredRankedPokemonEntries.filter((entry) => entry.sharedFavorites.length === 0);
      const entriesWithOverlap = favoriteFilteredRankedPokemonEntries
        .map((entry) => ({
          entry,
          overlapCount: entry.sharedFavorites.length,
        }))
        .filter(({ overlapCount }) => overlapCount >= 1);

      if (entriesWithOverlap.length === 0) {
        return noOverlapEntries.length > 0 ? [{ id: "none", title: "No Overlap", entries: noOverlapEntries }] : [];
      }

      const maxOverlap = entriesWithOverlap.reduce((max, current) => Math.max(max, current.overlapCount), 0);
      const orderedEntries = entriesWithOverlap.map(({ entry }) => entry);
      const sections: PokemonResultsSection[] = [];

      if (maxOverlap >= 4) {
        const best = orderedEntries.filter((entry) => entry.sharedFavorites.length === maxOverlap);
        const good = orderedEntries.filter((entry) => {
          const overlapCount = entry.sharedFavorites.length;
          return overlapCount === 2 || overlapCount === 3;
        });
        const some = orderedEntries.filter((entry) => entry.sharedFavorites.length === 1);
        if (best.length > 0) sections.push({ id: "best", title: "Best Matches", entries: best });
        if (good.length > 0) sections.push({ id: "good", title: "Good Matches", entries: good });
        if (some.length > 0) sections.push({ id: "some", title: "Some Overlap", entries: some });
        if (noOverlapEntries.length > 0) sections.push({ id: "none", title: "No Overlap", entries: noOverlapEntries });
        return sections;
      }

      if (maxOverlap === 2 || maxOverlap === 3) {
        const best = orderedEntries.filter((entry) => entry.sharedFavorites.length === maxOverlap);
        const some = orderedEntries.filter((entry) => {
          const overlapCount = entry.sharedFavorites.length;
          return overlapCount < maxOverlap && overlapCount >= 1;
        });
        if (best.length > 0) sections.push({ id: "best", title: "Best Matches", entries: best });
        if (some.length > 0) sections.push({ id: "some", title: "Some Overlap", entries: some });
        if (noOverlapEntries.length > 0) sections.push({ id: "none", title: "No Overlap", entries: noOverlapEntries });
        return sections;
      }

      const suggested = orderedEntries.filter((entry) => entry.sharedFavorites.length === 1);
      if (suggested.length > 0) sections.push({ id: "suggested", title: "Suggested", entries: suggested });
      if (noOverlapEntries.length > 0) sections.push({ id: "none", title: "No Overlap", entries: noOverlapEntries });
      return sections;
    }

    const noOverlapEntries = favoriteFilteredRankedPokemonEntries.filter((entry) => {
      const stats = pokemonMatchStatsById.get(entry.pokemon.id);
      return !stats || stats.totalOverlapCount === 0;
    });
    const overlapEntries = favoriteFilteredRankedPokemonEntries.filter((entry) => {
      const stats = pokemonMatchStatsById.get(entry.pokemon.id);
      return Boolean(stats && stats.totalOverlapCount > 0);
    });
    const maxGroupMatches = overlapEntries.reduce((max, entry) => {
      const stats = pokemonMatchStatsById.get(entry.pokemon.id);
      return Math.max(max, stats?.groupMatchCount ?? 0);
    }, 0);
    const sections: PokemonResultsSection[] = [];

    if (maxGroupMatches >= 2) {
      const best = overlapEntries.filter((entry) => (pokemonMatchStatsById.get(entry.pokemon.id)?.groupMatchCount ?? 0) === maxGroupMatches);
      const good = overlapEntries.filter((entry) => {
        const groupMatchCount = pokemonMatchStatsById.get(entry.pokemon.id)?.groupMatchCount ?? 0;
        return groupMatchCount > 0 && groupMatchCount < maxGroupMatches;
      });
      const some = overlapEntries.filter((entry) => (pokemonMatchStatsById.get(entry.pokemon.id)?.groupMatchCount ?? 0) === 0);
      if (best.length > 0) sections.push({ id: "best", title: "Best Matches", entries: best });
      if (good.length > 0) sections.push({ id: "good", title: "Good Overlap", entries: good });
      if (some.length > 0) sections.push({ id: "some", title: "Some Overlap", entries: some });
      if (noOverlapEntries.length > 0) sections.push({ id: "none", title: "No Overlap", entries: noOverlapEntries });
      return sections;
    }

    if (maxGroupMatches === 1) {
      const best = overlapEntries.filter((entry) => (pokemonMatchStatsById.get(entry.pokemon.id)?.groupMatchCount ?? 0) === 1);
      const some = overlapEntries.filter((entry) => (pokemonMatchStatsById.get(entry.pokemon.id)?.groupMatchCount ?? 0) === 0);
      if (best.length > 0) sections.push({ id: "best", title: "Best Matches", entries: best });
      if (some.length > 0) sections.push({ id: "some", title: "Some Overlap", entries: some });
      if (noOverlapEntries.length > 0) sections.push({ id: "none", title: "No Overlap", entries: noOverlapEntries });
      return sections;
    }

    if (maxGroupMatches === 0) {
      const suggested = overlapEntries.filter((entry) => (pokemonMatchStatsById.get(entry.pokemon.id)?.totalOverlapCount ?? 0) > 0);
      if (suggested.length > 0) sections.push({ id: "suggested", title: "Suggested", entries: suggested });
      if (noOverlapEntries.length > 0) sections.push({ id: "none", title: "No Overlap", entries: noOverlapEntries });
      return sections;
    }

    if (overlapEntries.length > 0) {
      sections.push({ id: "best", title: "Best Matches", entries: overlapEntries });
    }
    if (noOverlapEntries.length > 0) {
      sections.push({ id: "none", title: "No Overlap", entries: noOverlapEntries });
    }
    return sections;
  }, [favoriteFilteredRankedPokemonEntries, isPokemonFilterActive, pokemonMatchStatsById, pokemonSortMode, selectedPokemon.length]);
  const visiblePokemonResultCount = useMemo(
    () => visiblePokemonSections.reduce((sum, section) => sum + section.entries.length, 0),
    [visiblePokemonSections],
  );
  const currentHomeAddedItemIdSet = useMemo(
    () => new Set(buildItemEntries.filter((entry) => entry.quantityInBuild > 0).map((entry) => entry.itemId)),
    [buildItemEntries],
  );
  const phaseRankedItems = useMemo(
    () => (activePhase === "extra_items" ? extraRankedItems : comfortRankedItems),
    [activePhase, comfortRankedItems, extraRankedItems],
  );
  const multiFilteredRankedItems = useMemo(() => {
    return phaseRankedItems.filter((entry) => {
      if (EXCLUDED_ITEMS_PAGE_MAIN_CATEGORIES.has(entry.item.generalCategoryLabel || "")) {
        return false;
      }
      return true;
    });
  }, [phaseRankedItems]);
  const comfortFavoriteFilteredRankedItems = useMemo(() => {
    if (activePhase !== "comfort_items" || activeComfortFavoriteFilters.length === 0) {
      return multiFilteredRankedItems;
    }
    const filterSet = new Set(activeComfortFavoriteFilters);
    return multiFilteredRankedItems.filter((entry) =>
      entry.item.favoriteCategoryIds.some((categoryId) => filterSet.has(categoryId)),
    );
  }, [activeComfortFavoriteFilters, activePhase, multiFilteredRankedItems]);
  const comfortPokemonFilteredRankedItems = useMemo(() => {
    if (activePhase !== "comfort_items" || selectedPokemon.length === 0) {
      return comfortFavoriteFilteredRankedItems;
    }
    if (activeItemPokemonFilterId) {
      const targetPokemon = selectedPokemon.find((pokemon) => pokemon.id === activeItemPokemonFilterId);
      if (!targetPokemon) return comfortFavoriteFilteredRankedItems;
      const targetFavoriteIdSet = new Set(targetPokemon.favoriteCategoryIds);
      return comfortFavoriteFilteredRankedItems.filter((entry) =>
        entry.item.favoriteCategoryIds.some((categoryId) => targetFavoriteIdSet.has(categoryId)),
      );
    }
    return comfortFavoriteFilteredRankedItems.filter((entry) =>
      selectedPokemon.some((pokemon) =>
        pokemon.favoriteCategoryIds.some((categoryId) => entry.item.favoriteCategoryIds.includes(categoryId)),
      ),
    );
  }, [activeItemPokemonFilterId, activePhase, comfortFavoriteFilteredRankedItems, selectedPokemon]);
  const itemMatchStatsById = useMemo(() => {
    const selectedPokemonFavoriteIdsById = new Map(
      selectedPokemon.map((pokemon) => [pokemon.id, new Set(pokemon.favoriteCategoryIds)]),
    );
    const statsByItemId = new Map<string, {
      groupMatchCount: number;
      individualMatchCount: number;
      totalOverlapCount: number;
      coverageCount: number;
      weightedScore: number;
    }>();

    comfortPokemonFilteredRankedItems.forEach((entry) => {
      const overlapIds = entry.item.favoriteCategoryIds.filter((categoryId) => selectedPokemonAllFavoriteCategoryIdSet.has(categoryId));
      const groupMatchCount = overlapIds.filter(
        (categoryId) => selectedPokemon.length > 0 && (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) === selectedPokemon.length,
      ).length;
      const individualMatchCount = overlapIds.filter((categoryId) => {
        const sharedCount = sharedFavoriteCountByCategoryId.get(categoryId) ?? 0;
        return sharedCount >= 1 && sharedCount < selectedPokemon.length;
      }).length;
      const coverageCount = selectedPokemon.reduce((count, pokemon) => {
        const favoriteIdSet = selectedPokemonFavoriteIdsById.get(pokemon.id);
        if (!favoriteIdSet) return count;
        return count + (overlapIds.some((categoryId) => favoriteIdSet.has(categoryId)) ? 1 : 0);
      }, 0);
      const totalOverlapCount = overlapIds.length;
      const weightedScore = coverageCount * 10 + totalOverlapCount * 2 + groupMatchCount;
      statsByItemId.set(entry.item.id, {
        groupMatchCount,
        individualMatchCount,
        totalOverlapCount,
        coverageCount,
        weightedScore,
      });
    });

    return statsByItemId;
  }, [comfortPokemonFilteredRankedItems, selectedPokemon, selectedPokemonAllFavoriteCategoryIdSet, sharedFavoriteCountByCategoryId]);
  const sortedPlannerItemEntries = useMemo(() => {
    if (activePhase === "comfort_items" && activeItemPokemonFilterId && selectedPokemon.length > 0) {
      const selectedFilterPokemon = selectedPokemon.find((pokemon) => pokemon.id === activeItemPokemonFilterId) ?? null;
      if (!selectedFilterPokemon) return [...comfortPokemonFilteredRankedItems];
      const selectedFavoriteIdSet = new Set(selectedFilterPokemon.favoriteCategoryIds);
      const otherSelectedPokemon = selectedPokemon.filter((pokemon) => pokemon.id !== selectedFilterPokemon.id);
      return [...comfortPokemonFilteredRankedItems].sort((left, right) => {
        const leftFavoriteIdSet = new Set(left.item.favoriteCategoryIds);
        const rightFavoriteIdSet = new Set(right.item.favoriteCategoryIds);
        const leftAlsoHelpsCount = otherSelectedPokemon.reduce(
          (count, pokemon) =>
            count + (pokemon.favoriteCategoryIds.some((categoryId) => leftFavoriteIdSet.has(categoryId)) ? 1 : 0),
          0,
        );
        const rightAlsoHelpsCount = otherSelectedPokemon.reduce(
          (count, pokemon) =>
            count + (pokemon.favoriteCategoryIds.some((categoryId) => rightFavoriteIdSet.has(categoryId)) ? 1 : 0),
          0,
        );
        if ((leftAlsoHelpsCount > 0) !== (rightAlsoHelpsCount > 0)) {
          return leftAlsoHelpsCount > 0 ? -1 : 1;
        }
        if (leftAlsoHelpsCount !== rightAlsoHelpsCount) return rightAlsoHelpsCount - leftAlsoHelpsCount;

        const leftPrimaryMatchCount = left.item.favoriteCategoryIds.filter((categoryId) => selectedFavoriteIdSet.has(categoryId)).length;
        const rightPrimaryMatchCount = right.item.favoriteCategoryIds.filter((categoryId) => selectedFavoriteIdSet.has(categoryId)).length;
        if (leftPrimaryMatchCount !== rightPrimaryMatchCount) return rightPrimaryMatchCount - leftPrimaryMatchCount;

        const leftHelpsPokemonCount = selectedPokemon.reduce(
          (count, pokemon) =>
            count + (pokemon.favoriteCategoryIds.some((categoryId) => leftFavoriteIdSet.has(categoryId)) ? 1 : 0),
          0,
        );
        const rightHelpsPokemonCount = selectedPokemon.reduce(
          (count, pokemon) =>
            count + (pokemon.favoriteCategoryIds.some((categoryId) => rightFavoriteIdSet.has(categoryId)) ? 1 : 0),
          0,
        );
        if (leftHelpsPokemonCount !== rightHelpsPokemonCount) return rightHelpsPokemonCount - leftHelpsPokemonCount;
        if (left.item.craftable !== right.item.craftable) {
          return left.item.craftable ? -1 : 1;
        }
        const leftSourceCount = left.item.sources.length + left.item.obtainabilityDetails.length;
        const rightSourceCount = right.item.sources.length + right.item.obtainabilityDetails.length;
        if (leftSourceCount !== rightSourceCount) {
          return rightSourceCount - leftSourceCount;
        }
        return left.item.name.localeCompare(right.item.name);
      });
    }
    if (activePhase === "comfort_items" && selectedPokemon.length > 1) {
      return [...comfortPokemonFilteredRankedItems].sort((left, right) => {
        const leftStats = itemMatchStatsById.get(left.item.id);
        const rightStats = itemMatchStatsById.get(right.item.id);
        if (!leftStats || !rightStats) return left.item.name.localeCompare(right.item.name);

        if (rightStats.coverageCount !== leftStats.coverageCount) return rightStats.coverageCount - leftStats.coverageCount;
        if (rightStats.totalOverlapCount !== leftStats.totalOverlapCount) return rightStats.totalOverlapCount - leftStats.totalOverlapCount;
        if (rightStats.weightedScore !== leftStats.weightedScore) return rightStats.weightedScore - leftStats.weightedScore;
        if (left.item.craftable !== right.item.craftable) {
          return left.item.craftable ? -1 : 1;
        }
        const leftSourceCount = left.item.sources.length + left.item.obtainabilityDetails.length;
        const rightSourceCount = right.item.sources.length + right.item.obtainabilityDetails.length;
        if (leftSourceCount !== rightSourceCount) {
          return rightSourceCount - leftSourceCount;
        }
        return left.item.name.localeCompare(right.item.name);
      });
    }

    const getEntryStats = (entry: (typeof multiFilteredRankedItems)[number]) => {
      const itemFavoriteIdSet = new Set(entry.item.favoriteCategoryIds);
      let helpsPokemonCount = 0;
      selectedPokemon.forEach((pokemon) => {
        if (pokemon.favoriteCategoryIds.some((categoryId) => itemFavoriteIdSet.has(categoryId))) {
          helpsPokemonCount += 1;
        }
      });
      const sharedOverlapCategoryCount = entry.item.favoriteCategoryIds.filter((categoryId) =>
        selectedPokemonSharedFavoriteCategoryIdSet.has(categoryId),
      ).length;
      return {
        helpsPokemonCount,
        sharedOverlapCategoryCount,
        favoriteCategoryCount: entry.item.favoriteCategoryIds.length,
        sourceCount: entry.item.sources.length + entry.item.obtainabilityDetails.length,
      };
    };

    return [...comfortPokemonFilteredRankedItems].sort((left, right) => {
      const leftStats = getEntryStats(left);
      const rightStats = getEntryStats(right);

      if (selectedPokemon.length > 0) {
        if (leftStats.helpsPokemonCount !== rightStats.helpsPokemonCount) {
          return rightStats.helpsPokemonCount - leftStats.helpsPokemonCount;
        }
        if (leftStats.sharedOverlapCategoryCount !== rightStats.sharedOverlapCategoryCount) {
          return rightStats.sharedOverlapCategoryCount - leftStats.sharedOverlapCategoryCount;
        }
        if (leftStats.favoriteCategoryCount !== rightStats.favoriteCategoryCount) {
          return rightStats.favoriteCategoryCount - leftStats.favoriteCategoryCount;
        }
        if (left.item.craftable !== right.item.craftable) {
          return left.item.craftable ? -1 : 1;
        }
        if (leftStats.sourceCount !== rightStats.sourceCount) {
          return rightStats.sourceCount - leftStats.sourceCount;
        }
        return left.item.name.localeCompare(right.item.name);
      }

      if (leftStats.favoriteCategoryCount !== rightStats.favoriteCategoryCount) {
        return rightStats.favoriteCategoryCount - leftStats.favoriteCategoryCount;
      }
      return left.item.name.localeCompare(right.item.name);
    });
  }, [activeItemPokemonFilterId, activePhase, comfortPokemonFilteredRankedItems, itemMatchStatsById, itemSortMode, selectedPokemon, selectedPokemonSharedFavoriteCategoryIdSet]);
  const isItemFavoriteFilterActive = activePhase === "comfort_items" && activeComfortFavoriteFilters.length > 0;
  const itemPlannerSections = useMemo(() => {
    if (isItemFavoriteFilterActive) {
      return [{ id: "filtered", title: "Filtered results", items: sortedPlannerItemEntries }];
    }
    if (activePhase === "extra_items") {
      const groupedByCategory = new Map<string, typeof sortedPlannerItemEntries>();
      sortedPlannerItemEntries.forEach((entry) => {
        const categoryLabel = entry.item.generalCategoryLabel || "Other";
        if (!groupedByCategory.has(categoryLabel)) {
          groupedByCategory.set(categoryLabel, []);
        }
        groupedByCategory.get(categoryLabel)!.push(entry);
      });

      return [...groupedByCategory.entries()]
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([categoryLabel, items]) => ({
          id: `extra_${categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          title: categoryLabel,
          items: [...items].sort((left, right) => left.item.name.localeCompare(right.item.name)),
        }));
    }
    if (selectedPokemon.length === 0) {
      const groupedByCategory = new Map<string, typeof sortedPlannerItemEntries>();
      sortedPlannerItemEntries.forEach((entry) => {
        const categoryLabel = entry.item.generalCategoryLabel || "Other";
        if (!groupedByCategory.has(categoryLabel)) {
          groupedByCategory.set(categoryLabel, []);
        }
        groupedByCategory.get(categoryLabel)!.push(entry);
      });
      return [...groupedByCategory.entries()]
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([categoryLabel, items]) => ({
          id: `comfort_${categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          title: categoryLabel,
          items: [...items].sort((left, right) => left.item.name.localeCompare(right.item.name)),
        }));
    }
    if (activePhase === "comfort_items" && selectedPokemon.length > 1) {
      const best = sortedPlannerItemEntries.filter(
        (entry) => (itemMatchStatsById.get(entry.item.id)?.coverageCount ?? 0) === selectedPokemon.length,
      );
      const good = sortedPlannerItemEntries.filter((entry) => {
        const coverageCount = itemMatchStatsById.get(entry.item.id)?.coverageCount ?? 0;
        return coverageCount >= 2 && coverageCount < selectedPokemon.length;
      });
      const some = sortedPlannerItemEntries.filter(
        (entry) => (itemMatchStatsById.get(entry.item.id)?.coverageCount ?? 0) === 1,
      );
      const none = sortedPlannerItemEntries
        .filter((entry) => (itemMatchStatsById.get(entry.item.id)?.coverageCount ?? 0) === 0)
        .sort((left, right) => left.item.name.localeCompare(right.item.name));

      return [
        { id: "best", title: "Best Matches", items: best },
        { id: "good", title: "Good Overlap", items: good },
        { id: "some", title: "Some Overlap", items: some },
        { id: "none", title: "No Overlap", items: none },
      ].filter((section) => section.items.length > 0);
    }

    const bestThreshold = Math.max(2, Math.ceil(selectedPokemon.length / 2));
    const best: typeof sortedPlannerItemEntries = [];
    const useful: typeof sortedPlannerItemEntries = [];
    const more: typeof sortedPlannerItemEntries = [];

    sortedPlannerItemEntries.forEach((entry) => {
      const itemFavoriteIdSet = new Set(entry.item.favoriteCategoryIds);
      const helpsPokemonCount = selectedPokemon.reduce(
        (count, pokemon) => count + (pokemon.favoriteCategoryIds.some((categoryId) => itemFavoriteIdSet.has(categoryId)) ? 1 : 0),
        0,
      );
      const hasSharedOverlap = entry.item.favoriteCategoryIds.some((categoryId) =>
        selectedPokemonSharedFavoriteCategoryIdSet.has(categoryId),
      );

      if (helpsPokemonCount >= bestThreshold || hasSharedOverlap) {
        best.push(entry);
        return;
      }
      if (helpsPokemonCount > 0) {
        useful.push(entry);
        return;
      }
      more.push(entry);
    });

    return [
      { id: "best", title: "Best for your group", items: best },
      { id: "useful", title: "Useful options", items: useful },
      { id: "more", title: "More items", items: more },
    ].filter((section) => section.items.length > 0);
  }, [activePhase, isItemFavoriteFilterActive, itemMatchStatsById, itemSortMode, selectedPokemon, selectedPokemonSharedFavoriteCategoryIdSet, sortedPlannerItemEntries]);
  const itemSectionUsefulRangeById = useMemo(() => {
    const rangeBySectionId = new Map<string, string>();
    if (activePhase === "extra_items" || selectedPokemon.length === 0) return rangeBySectionId;

    itemPlannerSections.forEach((section) => {
      const helpsCounts = section.items.map((entry) =>
        selectedPokemon.reduce(
          (count, pokemon) =>
            count + (pokemon.favoriteCategoryIds.some((categoryId) => entry.item.favoriteCategoryIds.includes(categoryId)) ? 1 : 0),
          0,
        ),
      );
      if (helpsCounts.length === 0) return;
      const minCount = Math.min(...helpsCounts);
      const maxCount = Math.max(...helpsCounts);
      const summary = minCount === maxCount
        ? `Typically helps ${minCount} Pokemon.`
        : `Typically helps ${minCount}-${maxCount} Pokemon.`;
      rangeBySectionId.set(section.id, summary);
    });

    return rangeBySectionId;
  }, [activePhase, itemPlannerSections, selectedPokemon]);
  const totalVisibleItems = activePhase === "comfort_items" ? comfortPokemonFilteredRankedItems.length : multiFilteredRankedItems.length;
  const topFavoriteCategoryChips = useMemo(() => {
    const counts = new Map<string, number>();
    buildItemEntries.forEach((entry) => {
      const item = entities.itemsById[entry.itemId];
      if (!item) return;
      item.favoriteCategoryIds.forEach((categoryId) => {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + entry.quantityInBuild);
      });
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1]);
  }, [buildItemEntries, entities]);
  const sharedFavoriteTotal = sharedFavoriteCounts.filter(([, count]) => count > 1).length;
  const sharedHabitatTotal = sharedHabitatCounts.filter(([, count]) => count > 1).length;
  const sidebarPrimarySharedFavorites = useMemo(
    () => sharedFavoriteCounts.filter(([, count]) => count >= 2),
    [sharedFavoriteCounts],
  );
  const sidebarSecondarySharedFavorites = useMemo(
    () => sharedFavoriteCounts.filter(([, count]) => count < 2),
    [sharedFavoriteCounts],
  );
  const summaryVisiblePokemon = useMemo(() => {
    if (isSummaryPokemonExpanded) return selectedPokemon;
    if (selectedPokemon.length <= 6) return selectedPokemon;
    return selectedPokemon.slice(0, 5);
  }, [isSummaryPokemonExpanded, selectedPokemon]);
  const summaryOverflowPokemonCount = Math.max(selectedPokemon.length - 5, 0);
  const isBuildSummaryNullState =
    selectedPokemon.length === 0 &&
    totalItemQuantity === 0 &&
    buildProgressSummary.totalMaterials === 0;
  const isItemsSummaryEmpty = totalItemQuantity === 0;
  const isMaterialsSummaryEmpty = buildProgressSummary.totalMaterials === 0;

  useEffect(() => {
    if (activeItemPokemonFilterId && !selectedPokemon.some((pokemon) => pokemon.id === activeItemPokemonFilterId)) {
      setActiveItemPokemonFilterId(null);
    }
  }, [activeItemPokemonFilterId, selectedPokemon]);
  useEffect(() => {
    const visibleResultPokemonIdSet = new Set(multiFilteredPokemonEntries.map((entry) => entry.pokemon.id));
    setExpandedResultPokemonIds((previousIds) => {
      const nextIds = previousIds.filter((pokemonId) => visibleResultPokemonIdSet.has(pokemonId));
      if (nextIds.length === previousIds.length && nextIds.every((pokemonId, index) => pokemonId === previousIds[index])) {
        return previousIds;
      }
      return nextIds;
    });
  }, [multiFilteredPokemonEntries]);
  useEffect(() => {
    const visibleResultItemIdSet = new Set(sortedPlannerItemEntries.map((entry) => entry.item.id));
    setExpandedResultItemIds((previousIds) => {
      const nextIds = previousIds.filter((itemId) => visibleResultItemIdSet.has(itemId));
      if (nextIds.length === previousIds.length && nextIds.every((itemId, index) => itemId === previousIds[index])) {
        return previousIds;
      }
      return nextIds;
    });
  }, [sortedPlannerItemEntries]);
  useEffect(() => {
    if (activePhase !== "comfort_items" && activeComfortFavoriteFilters.length > 0) {
      setActiveComfortFavoriteFilters([]);
      itemFilterSectionStateRef.current = null;
    }
  }, [activeComfortFavoriteFilters.length, activePhase]);
  useEffect(() => {
    if (activePhase !== "comfort_items") return;
    const filterKey = [...activeComfortFavoriteFilters].sort().join("|");
    if (activeComfortFavoriteFilters.length > 0) {
      if (!itemFilterSectionStateRef.current) {
        itemFilterSectionStateRef.current = {
          expanded: expandedItemSectionIds,
          collapsed: collapsedItemSectionIds,
        };
      }
      const sectionIds = itemPlannerSections.map((section) => section.id);
      setExpandedItemSectionIds((previousIds) => {
        if (previousIds.length === sectionIds.length && previousIds.every((id, index) => id === sectionIds[index])) {
          return previousIds;
        }
        return sectionIds;
      });
      setCollapsedItemSectionIds((previousIds) => (previousIds.length === 0 ? previousIds : []));
      setCollapsingItemSectionIds((previousIds) => (previousIds.length === 0 ? previousIds : []));
      setEnteringItemSectionIds((previousIds) => (previousIds.length === 0 ? previousIds : []));
      if (lastAppliedComfortFilterKeyRef.current !== filterKey) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        lastAppliedComfortFilterKeyRef.current = filterKey;
      }
      return;
    }
    if (itemFilterSectionStateRef.current) {
      setExpandedItemSectionIds(itemFilterSectionStateRef.current.expanded);
      setCollapsedItemSectionIds(itemFilterSectionStateRef.current.collapsed);
      itemFilterSectionStateRef.current = null;
    }
    lastAppliedComfortFilterKeyRef.current = "";
  }, [activeComfortFavoriteFilters, activePhase, itemPlannerSections]);
  useLayoutEffect(() => {
    const container = tabContainerRef.current;
    const activeButton = tabButtonRefs.current[activePhase];
    if (!container || !activeButton) return;

    setActiveTabIndicator({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });

    const scrollContainer = container.parentElement;
    if (scrollContainer) {
      const btnLeft = activeButton.offsetLeft;
      const btnRight = btnLeft + activeButton.offsetWidth;
      const visibleLeft = scrollContainer.scrollLeft;
      const visibleRight = visibleLeft + scrollContainer.clientWidth;
      if (btnLeft < visibleLeft) {
        scrollContainer.scrollLeft = btnLeft;
      } else if (btnRight > visibleRight) {
        scrollContainer.scrollLeft = btnRight - scrollContainer.clientWidth;
      }
    }
  }, [activePhase]);

  useLayoutEffect(() => {
    const header = builderHeaderRef.current;
    if (!header) return;
    const update = () => {
      document.documentElement.style.setProperty("--builder-header-h", `${header.getBoundingClientRect().height}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const title = builderTitleRef.current;
    if (!title) return;
    const update = () => {
      const isLg = window.innerWidth >= 1024;
      document.documentElement.style.setProperty(
        "--builder-title-h",
        isLg ? `${title.getBoundingClientRect().height}px` : "0px",
      );
    };
    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(title);
    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const detailItemId = state.browse.items.detailItemId;
    if (!detailItemId) {
      setItemDetailTrail([]);
      return;
    }

    setItemDetailTrail((previousTrail) => {
      if (previousTrail.length === 0) return [detailItemId];
      if (previousTrail[previousTrail.length - 1] === detailItemId) return previousTrail;

      const previousIndex = previousTrail.lastIndexOf(detailItemId);
      if (previousIndex >= 0) {
        return previousTrail.slice(0, previousIndex + 1);
      }

      return [...previousTrail, detailItemId];
    });
  }, [state.browse.items.detailItemId]);

  const shouldShowResultsSkeleton = showInitialSkeleton || isResultsRefreshing;

  const renderItemsContextPanel = (keyPrefix: string) => {
    const comfortEntries = buildItemEntries.filter(
      (entry) => (entities.itemsById[entry.itemId]?.comfortCategoryIds.length ?? 0) > 0,
    );
    const selectedPokemonCoverageSummaries = selectedPokemon.map((pokemon) => {
      const favoriteCategoryIdSet = new Set(pokemon.favoriteCategoryIds);
      const matchingItemEntries = comfortEntries.filter((entry) =>
        (entities.itemsById[entry.itemId]?.favoriteCategoryIds ?? []).some((categoryId) =>
          favoriteCategoryIdSet.has(categoryId),
        ),
      );
      const coveredFavoriteCategoryIds = pokemon.favoriteCategoryIds.filter((categoryId) =>
        matchingItemEntries.some((entry) =>
          (entities.itemsById[entry.itemId]?.favoriteCategoryIds ?? []).includes(categoryId),
        ),
      );
      const uncoveredFavoriteCategoryIds = pokemon.favoriteCategoryIds.filter(
        (categoryId) => !coveredFavoriteCategoryIds.includes(categoryId),
      );
      return { pokemon, matchingItemCount: matchingItemEntries.length, matchingItemEntries, coveredFavoriteCategoryIds, uncoveredFavoriteCategoryIds };
    });

    const toggleComfortFavoriteFilter = (categoryId: string) => {
      setActiveComfortFavoriteFilters((previous) =>
        previous.includes(categoryId) ? previous.filter((id) => id !== categoryId) : [...previous, categoryId],
      );
    };

    if (selectedPokemonCoverageSummaries.length === 0) {
      return (
        <div className="rounded-[16px] border border-dashed border-[var(--pk-border)] p-5 text-center">
          <p className="text-sm font-semibold text-[var(--pk-text-primary)]">No Pokémon selected</p>
          <p className="mt-1 text-xs text-[var(--pk-text-desc)]">Add Pokémon to see how comfort items support them.</p>
        </div>
      );
    }

    return (
      <section className="space-y-2">
        <p className="text-base font-extrabold tracking-[-0.02em] text-[#485864]">Your Pokemon</p>
        <div className="space-y-1.5">
          {selectedPokemonCoverageSummaries.map((summary) => {
            const ITEM_AVATAR_ROW_CAP = 6;
            const isCoverageExpanded = expandedCoveragePokemonIds.has(summary.pokemon.id);
            const visibleEntries = isCoverageExpanded ? summary.matchingItemEntries : summary.matchingItemEntries.slice(0, ITEM_AVATAR_ROW_CAP);
            const hiddenCount = summary.matchingItemEntries.length - ITEM_AVATAR_ROW_CAP;
            return (
              <article
                key={`${keyPrefix}-pokemon-coverage-${summary.pokemon.id}`}
                className="rounded-[16px] border border-[var(--pk-border)] bg-[var(--pk-canvas)] p-2"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-[12px] bg-[var(--pk-border)] p-1.5">
                    {summary.pokemon.imageUrl ? (
                      <img src={summary.pokemon.imageUrl} alt={summary.pokemon.name} className="h-8 w-8 object-contain" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-[#485864]">{summary.pokemon.name}</p>
                    <p className="text-xs text-[#6c889b]">{summary.matchingItemCount} supporting items</p>
                  </div>
                </div>
                {summary.matchingItemEntries.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {visibleEntries.map((entry) => {
                      const item = entities.itemsById[entry.itemId];
                      if (!item) return null;
                      return (
                        <Tooltip key={`${keyPrefix}-img-${summary.pokemon.id}-${entry.itemId}`} content={item.name}>
                          <span className="inline-flex rounded-[8px] bg-[var(--pk-border)] p-1">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-6 w-6 object-contain" />
                            ) : (
                              <span className="h-6 w-6" />
                            )}
                          </span>
                        </Tooltip>
                      );
                    })}
                    {!isCoverageExpanded && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCoveragePokemonIds((prev) => new Set([...prev, summary.pokemon.id]))}
                        className="inline-flex items-center rounded-[8px] bg-[var(--pk-border)] px-1.5 text-xs font-medium text-[var(--pk-text-desc)] hover:text-[var(--pk-text-primary)]"
                      >
                        +{hiddenCount}
                      </button>
                    )}
                    {isCoverageExpanded && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCoveragePokemonIds((prev) => { const next = new Set(prev); next.delete(summary.pokemon.id); return next; })}
                        className="inline-flex items-center rounded-[8px] bg-[var(--pk-border)] px-1.5 text-xs font-medium text-[var(--pk-text-desc)] hover:text-[var(--pk-text-primary)]"
                      >
                        −
                      </button>
                    )}
                  </div>
                )}
                {summary.uncoveredFavoriteCategoryIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-[var(--pk-text-desc)]">
                      Needs coverage ({summary.uncoveredFavoriteCategoryIds.length})
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {summary.uncoveredFavoriteCategoryIds.map((categoryId) => (
                        <Chip
                          key={`uncovered-${summary.pokemon.id}-${categoryId}`}
                          size="compact"
                          tone={activeComfortFavoriteFilters.includes(categoryId) ? "primary" : "default"}
                          onClick={() => toggleComfortFavoriteFilter(categoryId)}
                        >
                          {favoriteCategoryById.get(categoryId)?.name ?? categoryId}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="relative pb-24 lg:pb-0">
      <div className="space-y-0">
        <section ref={builderTitleRef} className="w-full border-b border-[var(--pk-border)] bg-[var(--pk-brand-light)] px-4 py-4 lg:px-10 lg:sticky lg:z-40" style={{ top: "var(--pk-sticky-nav-h)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-[-0.03em] text-[var(--pk-text-primary)]">Build Planner</h1>
              <p className="text-sm text-[var(--pk-text-desc)]">
                {selectedPokemon.length} Pokemon · {totalItemQuantity} Items · {buildProgressSummary.totalMaterials} Materials
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/homes/view")}
                className="pk-btn pk-btn-primary pk-btn-sm"
              >
                View Build
              </button>
              <button
                type="button"
                onClick={saveCurrentHomeAsNew}
                className="pk-btn pk-btn-secondary pk-btn-sm"
              >
                Start New
              </button>
            </div>
          </div>
        </section>
        <div ref={builderHeaderRef} className="sticky z-40 w-full overflow-x-auto border-b border-[var(--pk-border)] bg-[var(--pk-brand-light)] pb-0 pt-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ top: "calc(var(--pk-sticky-nav-h) + var(--builder-title-h, 0px))" }}>
          <div ref={tabContainerRef} className="inline-flex items-end justify-start gap-1 px-4 lg:px-10">
            {phaseTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToPhase(tab.id)}
                ref={(node) => {
                  tabButtonRefs.current[tab.id] = node;
                }}
                style={{
                  borderBottom: activePhase === tab.id ? "2px solid var(--pk-brand)" : "2px solid transparent",
                  borderRadius: "0",
                  fontFamily: "inherit",
                }}
                className={`relative inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-tl-[6px] rounded-tr-[6px] px-5 py-2.5 text-sm font-semibold leading-none transition-colors duration-150 ${
                  activePhase === tab.id
                    ? "bg-white text-[var(--pk-brand)]"
                    : "bg-transparent text-[var(--pk-text-desc)] hover:text-[var(--pk-brand)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      {/* Section: Main layout */}
      <div className="grid gap-4">
        {/* Section: Browse workspace */}
        <section className="space-y-6">
          {/* Section: Controls */}
          {activePhase === "review_materials" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <BuilderSearchField
                  value={state.browse.favorites.searchQuery}
                  onChange={(query) => dispatch({ type: "browse/favorites/set-search", query })}
                  placeholder="Search favorites items"
                />
                <label className="flex h-9 items-center gap-2 rounded-[8px] bg-[#c2dbe6] px-3 py-1.5 text-sm font-medium text-[#6c889b]">
                  <select
                    value={state.browse.favorites.favoriteCategoryId ?? ""}
                    onChange={(event) =>
                      dispatch({ type: "browse/favorites/set-favorite-category", categoryId: event.target.value || null })
                    }
                    className="appearance-none bg-transparent pr-5 focus:outline-none"
                  >
                    <option value="">All favorites</option>
                    {favoriteCategoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {toCategoryLabel(category.id)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-5 w-5 text-[#6c889b]" />
                </label>
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-[320px_minmax(0,1fr)] md:items-start">
            {/* Section: Context sidebar — desktop only (mobile uses bottom sheet) */}
            <div className="app-scrollbar builder-sidebar-panel order-1 hidden border-r border-[var(--pk-border)] bg-[var(--pk-canvas)] md:block">
              <div className="px-4 pb-12 pt-6 lg:px-6">
          {showInitialSkeleton || isTabTransitionLoading ? (
            <BuilderSidebarSkeleton />
          ) : contentActiveTab === "pokemon" ? (
            <div className="space-y-5">
              <section className="space-y-2">
                <p className="text-base font-extrabold tracking-[-0.02em] text-[#485864]">Your Pokemon</p>
                {selectedPokemon.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedPokemon.map((pokemon) => {
                      const overlapFavoriteIds =
                        selectedPokemonFavoriteSets.excludingSelfByPokemonId.get(pokemon.id) ??
                        selectedPokemonFavoriteSets.allSelectedFavoriteIds;
                      const sharedCount = pokemon.favoriteCategoryIds.filter((categoryId) => (sharedFavoriteCounts.find(([id]) => id === categoryId)?.[1] ?? 0) > 1).length;
                      const hasFavorites = pokemon.favoriteCategoryIds.length > 0;
                      const chips = (() => {
                        if (!showSidebarDetails || !hasFavorites) return [];
                        const originalOrder = new Map(
                          pokemon.favoriteCategoryIds.map((categoryId, index) => [categoryId, index]),
                        );
                        return [...pokemon.favoriteCategoryIds]
                          .sort((left, right) => {
                            const leftSharedCount = sharedFavoriteCountByCategoryId.get(left) ?? 0;
                            const rightSharedCount = sharedFavoriteCountByCategoryId.get(right) ?? 0;
                            if (leftSharedCount !== rightSharedCount) return rightSharedCount - leftSharedCount;
                            const leftOverlap = overlapFavoriteIds.has(left) ? 1 : 0;
                            const rightOverlap = overlapFavoriteIds.has(right) ? 1 : 0;
                            if (leftOverlap !== rightOverlap) return rightOverlap - leftOverlap;
                            return (originalOrder.get(left) ?? 0) - (originalOrder.get(right) ?? 0);
                          })
                          .map((categoryId) => {
                            const tone: "primary" | "default" = overlapFavoriteIds.has(categoryId) ? "primary" : "default";
                            return {
                              id: categoryId,
                              label: toCategoryLabel(categoryId),
                              isSelected: activePokemonFavoriteFilters.includes(categoryId),
                              tone,
                              onToggle: () =>
                                setActivePokemonFavoriteFilters((previous) =>
                                  previous.includes(categoryId)
                                    ? previous.filter((id) => id !== categoryId)
                                    : [...previous, categoryId],
                                ),
                            };
                          });
                      })();
                      return (
                        <SidebarPokemonCard
                          key={`context-${pokemon.id}`}
                          name={pokemon.name}
                          subtitle={
                            selectedPokemon.length >= 2
                              ? sharedCount > 0
                                ? `${getPreferredHabitatLabel(pokemon.idealHabitatId)} · ${sharedCount} shared favorites`
                                : `${getPreferredHabitatLabel(pokemon.idealHabitatId)}`
                              : `${getPreferredHabitatLabel(pokemon.idealHabitatId)}`
                          }
                          imageUrl={pokemon.imageUrl}
                          onRemove={() => dispatch({ type: "home/remove-pokemon", pokemonId: pokemon.id })}
                          chips={chips}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-dashed border-[#b3c9d2] p-3 text-xs italic text-[#6c889b]">
                    Select Pokemon to get started.
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <p className="text-base font-extrabold tracking-[-0.02em] text-[#485864]">Preferred Habitats</p>
                {selectedPokemon.length >= 2 && sharedHabitatCounts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {sharedHabitatCounts.map(([habitatId, count]) => (
                      <span key={`sidebar-habitat-${habitatId}`} className="group/overlap relative inline-flex">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePokemonHabitatFilters((previous) =>
                              previous.includes(habitatId)
                                ? previous.filter((id) => id !== habitatId)
                                : [...previous, habitatId],
                            )
                          }
                          className={`pk-chip pk-chip-standard transition-colors ${
                            activePokemonHabitatFilters.includes(habitatId)
                              ? "pk-chip-primary"
                              : "pk-chip-surface"
                          }`}
                        >
                          {getPreferredHabitatLabel(habitatId)} ({count})
                        </button>
                        <OverlapTooltip
                          items={selectedPokemon
                            .filter((pokemon) => pokemon.idealHabitatId === habitatId)
                            .map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                          tooltipKeyPrefix={`sidebar-habitat-${habitatId}-tooltip`}
                        />
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-[#8e9aa3]">
                    {selectedPokemon.length === 0
                      ? "No Pokemon added yet."
                      : selectedPokemon.length === 1
                        ? "Add 1 more Pokemon to see shared habitats."
                        : "No shared habitats yet."}
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <p className="text-base font-extrabold tracking-[-0.02em] text-[#485864]">Group Overlap</p>
                {selectedPokemon.length >= 2 && sharedFavoriteCounts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {sidebarPrimarySharedFavorites.map(([categoryId, count]) => (
                      <span key={`sidebar-fav-${categoryId}`} className="group/overlap relative inline-flex">
                        <button
                          type="button"
                          onClick={() =>
                            setActivePokemonFavoriteFilters((previous) =>
                              previous.includes(categoryId)
                                ? previous.filter((id) => id !== categoryId)
                                : [...previous, categoryId],
                            )
                          }
                          className={`pk-chip pk-chip-standard transition-colors ${
                            activePokemonFavoriteFilters.includes(categoryId)
                              ? "pk-chip-primary"
                              : "pk-chip-surface"
                          }`}
                        >
                          {toCategoryLabel(categoryId)} ({count})
                        </button>
                        <OverlapTooltip
                          items={selectedPokemon
                            .filter((pokemon) => pokemon.favoriteCategoryIds.includes(categoryId))
                            .map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                          tooltipKeyPrefix={`sidebar-fav-${categoryId}-tooltip`}
                        />
                      </span>
                    ))}
                    {isSidebarFavoritesExpanded
                      ? sidebarSecondarySharedFavorites.map(([categoryId, count]) => (
                          <span key={`sidebar-fav-extra-${categoryId}`} className="group/overlap relative inline-flex">
                            <button
                              type="button"
                              onClick={() =>
                                setActivePokemonFavoriteFilters((previous) =>
                                  previous.includes(categoryId)
                                    ? previous.filter((id) => id !== categoryId)
                                    : [...previous, categoryId],
                                )
                              }
                              className={`pk-chip pk-chip-standard transition-colors ${
                                activePokemonFavoriteFilters.includes(categoryId)
                                  ? "pk-chip-primary"
                                  : "pk-chip-surface"
                              }`}
                            >
                              {toCategoryLabel(categoryId)} ({count})
                            </button>
                            <OverlapTooltip
                              items={selectedPokemon
                                .filter((pokemon) => pokemon.favoriteCategoryIds.includes(categoryId))
                                .map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                              tooltipKeyPrefix={`sidebar-fav-extra-${categoryId}-tooltip`}
                            />
                          </span>
                        ))
                      : null}
                    {sidebarSecondarySharedFavorites.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setIsSidebarFavoritesExpanded((value) => !value)}
                        className="pk-chip-count transition-colors hover:brightness-[0.98]"
                      >
                        {isSidebarFavoritesExpanded ? (
                          <span className="inline-flex items-center gap-1">
                            Show Less
                            <ChevronUp className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          `+${sidebarSecondarySharedFavorites.length} more`
                        )}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs italic text-[#8e9aa3]">
                    {selectedPokemon.length === 0
                      ? "No Pokemon added yet."
                      : selectedPokemon.length === 1
                        ? "Add 1 more Pokemon to see group overlap."
                        : "No shared favorites yet."}
                  </p>
                )}
              </section>
            </div>
          ) : contentActiveTab === "items" ? (
            <div className="space-y-3">
              {renderItemsContextPanel("context-items")}
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#b3c9d2] p-3 text-xs text-[#6c889b]">
              Context panel updates per tab. Pokemon context is currently available.
            </div>
          )}
              </div>
            </div>

            {/* Section: Active tab content */}
            <div ref={resultsPaneRef} className="order-2 bg-transparent p-0 pb-28 pl-4 pr-4 md:pb-12 builder-results-col app-scrollbar" aria-busy={shouldShowResultsSkeleton} data-testid="builder-results-pane">
            {showInitialSkeleton ? <BuilderResultsSkeleton /> : null}
            {/* Subsection: Items browser */}
            {!showInitialSkeleton && contentActiveTab === "items" ? (
              <>
                {buildItemEntries.length > 0 && (
                  <div
                    className="sticky z-20 flex items-center gap-2 border-b border-[var(--pk-border)] bg-[var(--pk-canvas)] py-2 lg:!top-0"
                    style={{ top: "calc(var(--pk-sticky-nav-h) + var(--builder-header-h, 0px))" }}
                  >
                    <span className="shrink-0 text-xs font-semibold text-[var(--pk-text-desc)]">
                      Items Added ({buildItemEntries.length})
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                      {buildItemEntries.map((entry) => {
                        const stripItem = entities.itemsById[entry.itemId];
                        if (!stripItem) return null;
                        return (
                          <Tooltip key={`strip-${entry.itemId}`} content={stripItem.name} side="bottom">
                            <span className="group/stripitem relative inline-flex shrink-0 rounded-[8px] bg-[var(--pk-border)] p-1">
                              {stripItem.image ? (
                                <img src={stripItem.image} alt={stripItem.name} className="h-6 w-6 object-contain" />
                              ) : (
                                <span className="h-6 w-6" />
                              )}
                              <button
                                type="button"
                                aria-label={`Remove ${stripItem.name}`}
                                onClick={() => dispatch({ type: "home/remove-item", itemId: entry.itemId })}
                                className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[var(--pk-text-desc)] text-[var(--pk-card)] text-[10px] group-hover/stripitem:flex"
                              >
                                ✕
                              </button>
                            </span>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                )}
                <ResultsBrowserBar>
                  <BuilderSearchField
                    value={state.browse.items.searchQuery}
                    onChange={(query) => dispatch({ type: "browse/items/set-search", query })}
                    placeholder="Search items"
                  />
                  <label className="flex h-9 items-center gap-2 rounded-[8px] bg-[#c2dbe6] px-3 py-1.5 text-sm font-medium text-[#6c889b]">
                    <select
                      value={state.browse.items.generalCategoryId ?? ""}
                      onChange={(e) => dispatch({ type: "browse/items/set-general-category", categoryId: e.target.value || null })}
                      className="appearance-none bg-transparent pr-5 focus:outline-none"
                    >
                      <option value="">All categories</option>
                      {itemCategories.map(({ id, label }) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </label>
                  {activePhase === "comfort_items" ? (
                    <ActiveFilterChips
                      chips={[
                        ...(activeItemPokemonFilter
                          ? [{ key: "pokemon-filter", label: `Showing items for ${activeItemPokemonFilter.name}`, onRemove: () => setActiveItemPokemonFilterId(null) }]
                          : []),
                        ...activeComfortFavoriteFilters.map((categoryId) => ({
                          key: `active-comfort-filter-${categoryId}`,
                          label: toCategoryLabel(categoryId),
                          onRemove: () => setActiveComfortFavoriteFilters((previous) => previous.filter((id) => id !== categoryId)),
                        })),
                      ]}
                      onClearAll={() => {
                        setActiveComfortFavoriteFilters([]);
                        setActiveItemPokemonFilterId(null);
                      }}
                    />
                  ) : null}
                </ResultsBrowserBar>
                <ResultsContent isRefreshing={isResultsRefreshing}>
                  {activePhase === "comfort_items" && (activeComfortFavoriteFilters.length > 0 || selectedPokemon.length > 0) && itemPlannerSections.length === 0 ? (
                    <section className="rounded-[16px] border border-[#C8DAE2] bg-[#E8F1F4] p-6">
                      <p className="text-lg font-extrabold text-[#485864]">
                        {activeItemPokemonFilter
                          ? `No items match ${activeItemPokemonFilter.name} yet.`
                          : "No matching comfort items"}
                      </p>
                      <p className="mt-1 text-sm text-[#6c889b]">
                        {activeItemPokemonFilter
                          ? `No available items satisfy ${activeItemPokemonFilter.name}'s favorites.`
                          : "Try removing one or more favorite filters."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveComfortFavoriteFilters([]);
                          setActiveItemPokemonFilterId(null);
                        }}
                        className="pk-btn pk-btn-secondary pk-btn-sm mt-3"
                      >
                        Clear all filters
                      </button>
                    </section>
                  ) : null}
                  {itemPlannerSections.map((section) => {
                      const isNullStateResults = selectedPokemon.length === 0;
                      const isFilteredSection = section.id === "filtered";
                      const isSectionCollapsed = !isFilteredSection && collapsedItemSectionIds.includes(section.id);
                      const isSectionExpanded = isFilteredSection || expandedItemSectionIds.includes(section.id);
                      const isSectionCollapsing = collapsingItemSectionIds.includes(section.id);
                      const isSectionEntering = enteringItemSectionIds.includes(section.id);
                      const showAllEntries = isSectionExpanded || isSectionCollapsing || isFilteredSection;
                      const hiddenCount = Math.max(section.items.length - MAX_ITEM_CARDS_PER_SECTION, 0);
                      return (
                        <CollapsibleResultsSection
                          key={section.id}
                          title={section.title}
                          count={section.items.length}
                          isCollapsed={isSectionCollapsed}
                          onToggle={isFilteredSection
                            ? () => {}
                            : () =>
                              setCollapsedItemSectionIds((previousIds) =>
                                previousIds.includes(section.id)
                                  ? previousIds.filter((id) => id !== section.id)
                                  : [...previousIds, section.id],
                              )}
                          description={
                            section.id.startsWith("az_")
                              ? undefined
                              :
                            section.id === "filtered"
                              ? "Results filtered by your selected Pokemon and favorites."
                              :
                            activePhase === "extra_items"
                              ? "Optional non-comfort extras for decoration and utility; materials are moved to the final review step."
                              : activePhase === "comfort_items" && selectedPokemon.length > 1 && section.id === "best"
                                ? "Helps all selected Pokemon."
                              : activePhase === "comfort_items" && selectedPokemon.length > 1 && section.id === "good"
                                ? "Helps multiple selected Pokemon."
                              : activePhase === "comfort_items" && selectedPokemon.length > 1 && section.id === "some"
                                ? "Helps one selected Pokemon."
                              : activePhase === "comfort_items" && selectedPokemon.length > 1 && section.id === "suggested"
                                ? "Light overlap suggestions when no group-wide favorites are available."
                              : activePhase === "comfort_items" && selectedPokemon.length > 1 && section.id === "none"
                                ? "Does not currently help your selected Pokemon."
                              : section.id === "useful"
                                ? "Typically helps at least 1 Pokemon."
                              : section.id === "more"
                                  ? "No group relevance, but can still be used to decorate."
                                  : "Browse all items by favorite-category coverage to find what fits your future team."
                          }
                        >
                          <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                        {section.items.map((entry, entryIndex) => {
                          const isOverflowEntry = entryIndex >= MAX_ITEM_CARDS_PER_SECTION;
                          const shouldHideOverflowEntry = isOverflowEntry && !showAllEntries;
                          if (shouldHideOverflowEntry) return null;
                          const showComfortContext = activePhase !== "extra_items";
                          const usePokemonSatisfactionUi = activePhase === "comfort_items" && (section.id === "filtered" || !section.id.startsWith("extra_"));
                          const itemFavoriteCategoryIdSet = new Set(entry.item.favoriteCategoryIds);
                          const useComfortGroupModel = activePhase === "comfort_items" && selectedPokemon.length > 1;
                          const matchingCategoryIds = selectedPokemon.length > 0 && showComfortContext
                            ? entry.item.favoriteCategoryIds.filter((categoryId) => selectedPokemonAllFavoriteCategoryIdSet.has(categoryId))
                            : [];
                          const nonMatchingCategoryIds = selectedPokemon.length > 0 && showComfortContext
                            ? entry.item.favoriteCategoryIds.filter((categoryId) => !selectedPokemonAllFavoriteCategoryIdSet.has(categoryId))
                            : [];
                          const helpsPokemonCount = selectedPokemon.length > 0
                            ? selectedPokemon.reduce(
                              (count, pokemon) =>
                                count + (pokemon.favoriteCategoryIds.some((categoryId) => itemFavoriteCategoryIdSet.has(categoryId)) ? 1 : 0),
                              0,
                            )
                            : 0;
                          const matchedPokemon = usePokemonSatisfactionUi && selectedPokemon.length > 0
                            ? selectedPokemon.filter((pokemon) =>
                              pokemon.favoriteCategoryIds.some((categoryId) => itemFavoriteCategoryIdSet.has(categoryId)),
                            )
                            : [];
                          const isItemFavoritesExpanded = expandedResultItemIds.includes(entry.item.id);
                          const collapsedFavoriteCategoryIds = section.id === "none"
                            ? entry.item.favoriteCategoryIds
                            : selectedPokemon.length > 0 && showComfortContext
                              ? matchingCategoryIds
                              : entry.item.favoriteCategoryIds;
                          const visibleFavoriteCategoryIds = isItemFavoritesExpanded
                            ? entry.item.favoriteCategoryIds
                            : collapsedFavoriteCategoryIds;
                          const hiddenFavoriteCount = selectedPokemon.length > 0 && showComfortContext
                            ? Math.max(nonMatchingCategoryIds.length, 0)
                            : Math.max(entry.item.favoriteCategoryIds.length - collapsedFavoriteCategoryIds.length, 0);
                          const shouldShowFavoriteOverflowToggle =
                            hiddenFavoriteCount > 0 &&
                            (selectedPokemon.length === 0 || section.id !== "more" || matchingCategoryIds.length > 0);

                          const shouldFadeOverflowEntry = isOverflowEntry;
                          const overflowIsVisible = showAllEntries && !isSectionCollapsing && !isSectionEntering;
                          const groupMatchCategoryIds = useComfortGroupModel
                            ? visibleFavoriteCategoryIds.filter(
                              (categoryId) => (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) === selectedPokemon.length,
                            )
                            : [];
                          const individualMatchCategoryIds = useComfortGroupModel
                            ? visibleFavoriteCategoryIds.filter((categoryId) => {
                              const sharedCount = sharedFavoriteCountByCategoryId.get(categoryId) ?? 0;
                              return sharedCount >= 1 && sharedCount < selectedPokemon.length;
                            })
                            : [];
                          const overlapPokemonByCategoryId = new Map(
                            visibleFavoriteCategoryIds.map((categoryId) => [
                              categoryId,
                              selectedPokemon.filter((pokemon) => pokemon.favoriteCategoryIds.includes(categoryId)),
                            ]),
                          );
                          const itemMetadataText = (() => {
                            if (usePokemonSatisfactionUi) {
                              if (activeItemPokemonFilter) {
                                return matchedPokemon.length > 0 ? `Helps ${activeItemPokemonFilter.name}` : "";
                              }
                              return matchedPokemon.length > 0 ? `Matches ${matchedPokemon.length} Pokemon` : "";
                            }
                            if (section.id === "none") return "";
                            if (selectedPokemon.length === 0) return "";
                            if (!useComfortGroupModel) return helpsPokemonCount > 0 ? `Useful for ${helpsPokemonCount} Pokemon` : "";
                            const stats = itemMatchStatsById.get(entry.item.id);
                            if (!stats) return "";
                            if (stats.groupMatchCount === 0 && stats.individualMatchCount === 0) {
                              return "";
                            }
                            if (stats.groupMatchCount > 0 && stats.individualMatchCount > 0) {
                              return `${stats.groupMatchCount} group favorite${stats.groupMatchCount === 1 ? "" : "s"} · ${stats.individualMatchCount} individual favorite${stats.individualMatchCount === 1 ? "" : "s"}`;
                            }
                            if (stats.groupMatchCount > 0) {
                              return `${stats.groupMatchCount} group favorite${stats.groupMatchCount === 1 ? "" : "s"}`;
                            }
                            return `${stats.individualMatchCount} individual favorite${stats.individualMatchCount === 1 ? "" : "s"}`;
                          })();
                          const itemPrimaryPillCount =
                            useComfortGroupModel && section.id !== "none"
                              ? groupMatchCategoryIds.length
                              : visibleFavoriteCategoryIds.length;
                          const itemSecondaryPillCount =
                            useComfortGroupModel && section.id !== "none" ? individualMatchCategoryIds.length : 0;
                          const itemHasVisibleFavoritePills =
                            usePokemonSatisfactionUi
                              ? showFavoritesByTab.items && matchedPokemon.length > 0
                              : showFavoritesByTab.items &&
                                ((selectedPokemon.length > 0 && showComfortContext
                                  ? itemPrimaryPillCount + itemSecondaryPillCount > 0
                                  : entry.item.favoriteCategoryIds.length > 0));
                          const isAdded = currentHomeAddedItemIdSet.has(entry.item.id);
                          return (
                            <ResultCardOverflowWrapper
                              key={entry.item.id}
                              isOverflow={shouldFadeOverflowEntry}
                              isVisible={overflowIsVisible}
                            >
                              <ResultCardShell
                                onClick={() => {
                                  if (!isAdded && state.browse.items.searchQuery) {
                                    const remaining = sortedPlannerItemEntries.filter((e) => e.item.id !== entry.item.id && !currentHomeAddedItemIdSet.has(e.item.id));
                                    if (remaining.length === 0) dispatch({ type: "browse/items/set-search", query: "" });
                                  }
                                  dispatch({ type: isAdded ? "home/remove-item" : "home/add-item", itemId: entry.item.id });
                                }}
                                onKeyDown={(event) => activateWithKeyboard(event, () => dispatch({ type: isAdded ? "home/remove-item" : "home/add-item", itemId: entry.item.id }))}
                                className={`relative rounded-[var(--pk-radius-md)] border border-[var(--pk-border)] bg-[var(--pk-card)] p-[10px] shadow-[var(--pk-shadow-sm)] transition-[border-color,box-shadow,opacity] duration-300 ease-out hover:border-[var(--pk-brand-border)] hover:shadow-[var(--pk-shadow-md)] ${isAdded ? "opacity-50 hover:opacity-70" : ""}`}
                              >
                              {isAdded && (
                                <button
                                  type="button"
                                  aria-label="Remove item"
                                  onClick={(e) => { e.stopPropagation(); dispatch({ type: "home/remove-item", itemId: entry.item.id }); }}
                                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--pk-text-desc)] text-[var(--pk-card)] text-xs leading-none hover:bg-[var(--pk-text-primary)]"
                                >
                                  ✕
                                </button>
                              )}
                              <div className={`flex gap-3 ${itemHasVisibleFavoritePills ? "items-start" : "items-center"}`}>
                                  <ResultCardImageWell src={entry.item.image} alt={entry.item.name} />
                                  <div className="min-w-0 flex-1">
                                    <ResultCardTitle>{entry.item.name}</ResultCardTitle>
                                    <p className="text-xs text-[var(--pk-text-desc)]">
                                    {(entry.item.generalCategoryLabel || "Other")}
                                    {selectedPokemon.length > 0 && showComfortContext && itemMetadataText
                                      ? ` · ${itemMetadataText}`
                                      : ""}
                                  </p>
                                  {usePokemonSatisfactionUi && showFavoritesByTab.items && matchedPokemon.length > 0 ? (
                                    <>
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {visibleFavoriteCategoryIds.map((categoryId) => {
                                          const sharedCount = sharedFavoriteCountByCategoryId.get(categoryId) ?? 0;
                                          const chipTone =
                                            selectedPokemon.length <= 1
                                              ? selectedPokemonAllFavoriteCategoryIdSet.has(categoryId) ? "pk-chip-best" : "pk-chip-none"
                                              : sharedCount === selectedPokemon.length ? "pk-chip-best"
                                              : sharedCount >= 1 ? "pk-chip-some"
                                              : "pk-chip-none";
                                          const pokemonForCategory = overlapPokemonByCategoryId.get(categoryId) ?? [];
                                          return (
                                            <span key={`${entry.item.id}-favorite-chip-${categoryId}`} className="group/overlap relative inline-flex">
                                              <span className={`pk-chip pk-chip-compact ${chipTone}`}>
                                                {toCategoryLabel(categoryId)}
                                              </span>
                                              {pokemonForCategory.length > 0 ? (
                                                <OverlapTooltip
                                                  items={pokemonForCategory.map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                                                  tooltipKeyPrefix={`item-sat-overlap-${entry.item.id}-${categoryId}`}
                                                />
                                              ) : null}
                                            </span>
                                          );
                                        })}
                                      </div>
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {matchedPokemon.map((pokemon) => (
                                          <span key={`${entry.item.id}-matched-pokemon-${pokemon.id}`} className="inline-flex items-center justify-center rounded-[10px] bg-[var(--pk-image-well)] p-1">
                                            {pokemon.imageUrl ? (
                                              <img src={pokemon.imageUrl} alt={pokemon.name} className="h-6 w-6 object-contain" />
                                            ) : (
                                              <span className="h-6 w-6" />
                                            )}
                                          </span>
                                        ))}
                                      </div>
                                    </>
                                  ) : null}
                                  {!usePokemonSatisfactionUi && showFavoritesByTab.items && selectedPokemon.length > 0 && showComfortContext && (itemPrimaryPillCount + itemSecondaryPillCount > 0) ? (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {(useComfortGroupModel && section.id !== "none" ? groupMatchCategoryIds : visibleFavoriteCategoryIds).map((categoryId) => {
                                          const overlapPokemon = overlapPokemonByCategoryId.get(categoryId) ?? [];
                                          return (
                                          <span key={`${entry.item.id}-${categoryId}`} className="group/overlap relative inline-flex">
                                            <span
                                              className={`pk-chip pk-chip-compact ${
                                                selectedPokemonAllFavoriteCategoryIdSet.has(categoryId)
                                                  ? "pk-chip-best"
                                                  : "pk-chip-none"
                                              }`}
                                            >
                                              {toCategoryLabel(categoryId)}
                                            </span>
                                            {overlapPokemon.length > 0 ? (
                                              <OverlapTooltip
                                                items={overlapPokemon.map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                                                tooltipKeyPrefix={`item-overlap-${entry.item.id}-${categoryId}`}
                                              />
                                            ) : null}
                                          </span>
                                        );
                                        })}
                                        {useComfortGroupModel && section.id !== "none"
                                          ? individualMatchCategoryIds.map((categoryId) => {
                                              const overlapPokemon = overlapPokemonByCategoryId.get(categoryId) ?? [];
                                              return (
                                              <span key={`${entry.item.id}-${categoryId}-individual`} className="group/overlap relative inline-flex">
                                                <span className="pk-chip pk-chip-compact pk-chip-some">
                                                  {toCategoryLabel(categoryId)}
                                                </span>
                                                {overlapPokemon.length > 0 ? (
                                                  <OverlapTooltip
                                                    items={overlapPokemon.map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                                                    tooltipKeyPrefix={`item-overlap-${entry.item.id}-${categoryId}-individual`}
                                                  />
                                                ) : null}
                                              </span>
                                            );
                                            })
                                          : null}
                                        {shouldShowFavoriteOverflowToggle ? null : null}
                                    </div>
                                  ) : null}
                                  {!usePokemonSatisfactionUi && showFavoritesByTab.items && (selectedPokemon.length === 0 || !showComfortContext) ? (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {entry.item.favoriteCategoryIds.map((categoryId) => (
                                          <span key={`${entry.item.id}-${categoryId}`} className="pk-chip pk-chip-compact pk-chip-none">
                                            {toCategoryLabel(categoryId)}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </ResultCardShell>
                            </ResultCardOverflowWrapper>
                          );
                        })}
                          </div>
                        <SeeAllToggle
                          show={section.items.length > MAX_ITEM_CARDS_PER_SECTION && !isFilteredSection}
                          isExpanded={isSectionExpanded}
                          isCollapsing={isSectionCollapsing}
                          hiddenCount={hiddenCount}
                          onToggle={() => toggleItemSectionExpansion(section.id)}
                        />
                        </CollapsibleResultsSection>
                      );
                    })}
                </ResultsContent>
                {totalVisibleItems === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-ink/20 bg-white p-4">
                    <p className="type-ui type-ui-strong text-ink">
                      {activePhase === "comfort_items" && activeItemPokemonFilter
                        ? `No items match ${activeItemPokemonFilter.name} yet.`
                        : "No items match this exact search."}
                    </p>
                    <p className="type-caption mt-1 text-ink/65">
                      {activePhase === "comfort_items" && activeItemPokemonFilter
                        ? `No available items satisfy ${activeItemPokemonFilter.name}'s favorites.`
                        : "Try clearing your search text to browse all addable items again."}
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* Subsection: Pokemon browser */}
            {!showInitialSkeleton && contentActiveTab === "pokemon" ? (
              <>
                <ResultsBrowserBar>
                  <BuilderSearchField
                    value={state.browse.pokemon.searchQuery}
                    onChange={(query) => dispatch({ type: "browse/pokemon/set-search", query })}
                    placeholder="Search Pokemon"
                  />
                  <ActiveFilterChips
                    chips={[
                      ...activePokemonFavoriteFilters.map((categoryId) => ({
                        key: `active-pokemon-filter-${categoryId}`,
                        label: toCategoryLabel(categoryId),
                        onRemove: () => setActivePokemonFavoriteFilters((previous) => previous.filter((id) => id !== categoryId)),
                      })),
                      ...activePokemonHabitatFilters.map((habitatId) => ({
                        key: `active-pokemon-habitat-filter-${habitatId}`,
                        label: getPreferredHabitatLabel(habitatId),
                        onRemove: () => setActivePokemonHabitatFilters((previous) => previous.filter((id) => id !== habitatId)),
                      })),
                    ]}
                    onClearAll={() => {
                      setActivePokemonFavoriteFilters([]);
                      setActivePokemonHabitatFilters([]);
                    }}
                  />
                </ResultsBrowserBar>
                <ResultsContent isRefreshing={isResultsRefreshing}>
                  {visiblePokemonSections.map((section) => {
                    if (section.entries.length === 0) return null;
                    const isNullStateResults = selectedPokemon.length === 0;
                    const isFilteredSection = section.id === "filtered";
                    const isAlphabeticalSection = section.id === "alphabetical";
                    const sectionId = section.id as PokemonSectionId;
                    const isSectionCollapsed = !isFilteredSection && !isAlphabeticalSection && collapsedPokemonSectionIds.includes(sectionId);
                    const isSectionExpanded = isFilteredSection || isAlphabeticalSection || expandedPokemonSectionIds.includes(sectionId);
                    const isSectionCollapsing = collapsingPokemonSectionIds.includes(sectionId);
                    const isSectionEntering = enteringPokemonSectionIds.includes(sectionId);
                    const showAllEntries = isNullStateResults || isSectionExpanded || isSectionCollapsing || isFilteredSection || isAlphabeticalSection;
                    const hiddenCount = Math.max(section.entries.length - MAX_POKEMON_CARDS_PER_SECTION, 0);
                    return (
                      <CollapsibleResultsSection
                        key={`pokemon-group-${section.id}`}
                        title={section.title}
                        count={section.entries.length}
                        isCollapsed={isSectionCollapsed}
                        onToggle={isFilteredSection || isAlphabeticalSection
                          ? () => {}
                          : () =>
                            setCollapsedPokemonSectionIds((previousIds) =>
                              previousIds.includes(sectionId)
                                ? previousIds.filter((id) => id !== sectionId)
                                : [...previousIds, sectionId],
                            )}
                        description={
                          selectedPokemon.length === 0
                            ? "Choose Pokemon to start finding compatible matches based on shared favorites."
                            : section.id === "alphabetical"
                              ? undefined
                            : section.id === "filtered"
                              ? "Results filtered by your selected favorites."
                            : section.id === "best"
                              ? "Prioritizes favorites shared by your whole group, then individual coverage."
                              : section.id === "good"
                                ? "Strong secondary matches with 2-3 overlaps."
                                : section.id === "some"
                                  ? "Lower-overlap matches. These share at least 1 favorite but rank below the top tier."
                                  : section.id === "suggested"
                                    ? "All results here share exactly 1 favorite with your current group."
                                    : "No current favorite overlap with your selected group."
                        }
                      >
                        <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                        {section.entries.map((entry, entryIndex) => (
                          (() => {
                    const isOverflowEntry = entryIndex >= MAX_POKEMON_CARDS_PER_SECTION;
                    const shouldHideOverflowEntry = isOverflowEntry && !showAllEntries;
                    const overlapFavoriteIds =
                      selectedPokemonFavoriteSets.excludingSelfByPokemonId.get(entry.pokemon.id) ??
                      selectedPokemonFavoriteSets.allSelectedFavoriteIds;
                    const sharedFavoriteCategoryIds = entry.sharedFavorites;
                    const isSharedOnlyMode = selectedPokemon.length > 0;
                    const cardFavoriteOrderIndexByCategoryId = new Map<string, number>();
                    entry.pokemon.favoriteCategoryIds.forEach((categoryId, index) => {
                      if (!cardFavoriteOrderIndexByCategoryId.has(categoryId)) {
                        cardFavoriteOrderIndexByCategoryId.set(categoryId, index);
                      }
                    });

                    const sortBySelectedPokemonOrder = (left: string, right: string) => {
                      const leftSelectedOrderIndex = selectedFavoriteOrderIndexByCategoryId.get(left);
                      const rightSelectedOrderIndex = selectedFavoriteOrderIndexByCategoryId.get(right);
                      if (
                        leftSelectedOrderIndex !== undefined &&
                        rightSelectedOrderIndex !== undefined &&
                        leftSelectedOrderIndex !== rightSelectedOrderIndex
                      ) {
                        return leftSelectedOrderIndex - rightSelectedOrderIndex;
                      }
                      if (leftSelectedOrderIndex !== undefined && rightSelectedOrderIndex === undefined) return -1;
                      if (leftSelectedOrderIndex === undefined && rightSelectedOrderIndex !== undefined) return 1;

                      const leftCardOrderIndex = cardFavoriteOrderIndexByCategoryId.get(left);
                      const rightCardOrderIndex = cardFavoriteOrderIndexByCategoryId.get(right);
                      if (
                        leftCardOrderIndex !== undefined &&
                        rightCardOrderIndex !== undefined &&
                        leftCardOrderIndex !== rightCardOrderIndex
                      ) {
                        return leftCardOrderIndex - rightCardOrderIndex;
                      }

                      return toCategoryLabel(left).localeCompare(toCategoryLabel(right));
                    };
                    const overlapFavoriteCategoryIds = [...sharedFavoriteCategoryIds].sort(sortBySelectedPokemonOrder);
                    const baseVisibleFavoriteCategoryIds = isSharedOnlyMode
                      ? overlapFavoriteCategoryIds
                      : entry.pokemon.favoriteCategoryIds;
                    const allFavoriteCategoryIdsForCard = isSharedOnlyMode
                      ? [...entry.pokemon.favoriteCategoryIds].sort(sortBySelectedPokemonOrder)
                      : [...entry.pokemon.favoriteCategoryIds];
                    const collapsedFavoriteCategoryIds = selectedPokemon.length === 0
                      ? allFavoriteCategoryIdsForCard
                      : section.id === "suggested" || section.id === "none"
                        ? allFavoriteCategoryIdsForCard
                        : baseVisibleFavoriteCategoryIds.slice(0, MAX_POKEMON_FAVORITES_TO_SHOW);
                    const isCardFavoritesExpanded = expandedResultPokemonIds.includes(entry.pokemon.id);
                    const visibleFavoriteCategoryIds = isCardFavoritesExpanded
                      ? allFavoriteCategoryIdsForCard
                      : collapsedFavoriteCategoryIds;
                    const hiddenFavoriteCount = Math.max(allFavoriteCategoryIdsForCard.length - collapsedFavoriteCategoryIds.length, 0);
                    const groupMatchCategoryIds = visibleFavoriteCategoryIds.filter(
                      (categoryId) => selectedPokemon.length > 1 && (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) === selectedPokemon.length,
                    );
                    const individualMatchCategoryIds = visibleFavoriteCategoryIds.filter((categoryId) => {
                      const sharedCount = sharedFavoriteCountByCategoryId.get(categoryId) ?? 0;
                      return selectedPokemon.length > 1 && sharedCount >= 1 && sharedCount < selectedPokemon.length;
                    });
                    const primaryMatchCategoryIds = selectedPokemon.length > 1
                      ? groupMatchCategoryIds
                      : visibleFavoriteCategoryIds;
                    const overlapPokemonByCategoryId = new Map(
                      visibleFavoriteCategoryIds.map((categoryId) => [
                        categoryId,
                        selectedPokemon.filter((pokemon) => pokemon.favoriteCategoryIds.includes(categoryId)),
                      ]),
                    );
                    const overlapMetadataText = (() => {
                      if (section.id === "none") return "";
                      if (selectedPokemon.length <= 1) {
                        const sharedCount = entry.sharedFavorites.length;
                        return `${sharedCount} shared favorite${sharedCount === 1 ? "" : "s"}`;
                      }
                      const groupCount = entry.sharedFavorites.filter(
                        (categoryId) => (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) === selectedPokemon.length,
                      ).length;
                      const individualCount = entry.sharedFavorites.filter(
                        (categoryId) => (sharedFavoriteCountByCategoryId.get(categoryId) ?? 0) < selectedPokemon.length,
                      ).length;
                      if (groupCount === 0 && individualCount === 0) {
                        return "";
                      }
                      if (groupCount > 0) {
                        return `${groupCount} shared favorite${groupCount === 1 ? "" : "s"}`;
                      }
                      return "";
                    })();
                    const pokemonPrimaryPillCount = section.id === "none" ? visibleFavoriteCategoryIds.length : primaryMatchCategoryIds.length;
                    const pokemonSecondaryPillCount =
                      selectedPokemon.length > 1 && section.id !== "none" ? individualMatchCategoryIds.length : 0;
                    const pokemonHasVisibleFavoritePills =
                      selectedPokemon.length > 0 && pokemonPrimaryPillCount + pokemonSecondaryPillCount > 0;
                    if (shouldHideOverflowEntry) return null;

                    const shouldFadeOverflowEntry = isOverflowEntry;
                    const overflowIsVisible = showAllEntries && !isSectionCollapsing && !isSectionEntering;

                    return (
                        <ResultCardOverflowWrapper
                          key={entry.pokemon.id}
                          isOverflow={shouldFadeOverflowEntry}
                          isVisible={overflowIsVisible}
                        >
                          <ResultCardShell
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              if (state.browse.pokemon.searchQuery) {
                                const remaining = favoriteFilteredRankedPokemonEntries.filter((e) => e.pokemon.id !== entry.pokemon.id);
                                if (remaining.length === 0) dispatch({ type: "browse/pokemon/set-search", query: "" });
                              }
                              dispatch({ type: "home/add-pokemon", pokemonId: entry.pokemon.id });
                            }}
                            onKeyDown={(event) => activateWithKeyboard(event, () => dispatch({ type: "home/add-pokemon", pokemonId: entry.pokemon.id }))}
                            className="rounded-[var(--pk-radius-md)] border border-[var(--pk-border)] bg-[var(--pk-card)] p-[10px] shadow-[0_2px_8px_rgba(59,130,246,0.12)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-[#2563EB] hover:shadow-[0_6px_16px_rgba(59,130,246,0.18)]"
                          >
                            <div className={`flex gap-3 ${pokemonHasVisibleFavoritePills ? "items-start" : "items-center"}`}>
                              <ResultCardImageWell src={entry.pokemon.imageUrl} alt={entry.pokemon.name} />
                              <div className="min-w-0 flex-1">
                                <ResultCardTitle>{entry.pokemon.name}</ResultCardTitle>
                                <p className="text-xs text-[var(--pk-text-desc)]">
                                  {getPreferredHabitatLabel(entry.pokemon.idealHabitatId)}
                                  {selectedPokemon.length > 0 ? ` · ${overlapMetadataText}` : ""}
                                </p>
                                {pokemonHasVisibleFavoritePills ? (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                  {(section.id === "none" ? visibleFavoriteCategoryIds : primaryMatchCategoryIds).map((categoryId) => {
                                    const overlapPokemon = overlapPokemonByCategoryId.get(categoryId) ?? [];
                                    return (
                                    <span key={`${entry.pokemon.id}-${categoryId}`} className="group/overlap relative inline-flex">
                                      <span
                                        className={`pk-chip pk-chip-compact ${
                                          overlapFavoriteIds.has(categoryId)
                                            ? "pk-chip-best"
                                            : "pk-chip-none"
                                        }`}
                                      >
                                        {toCategoryLabel(categoryId)}
                                      </span>
                                      {overlapPokemon.length > 0 ? (
                                        <OverlapTooltip
                                          items={overlapPokemon.map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                                          tooltipKeyPrefix={`pokemon-overlap-${entry.pokemon.id}-${categoryId}`}
                                        />
                                      ) : null}
                                    </span>
                                    );
                                  })}
                                  {selectedPokemon.length > 1 && section.id !== "none"
                                    ? individualMatchCategoryIds.map((categoryId) => {
                                        const overlapPokemon = overlapPokemonByCategoryId.get(categoryId) ?? [];
                                        return (
                                        <span key={`${entry.pokemon.id}-${categoryId}-extra`} className="group/overlap relative inline-flex">
                                          <span className="pk-chip pk-chip-compact pk-chip-some">
                                            {toCategoryLabel(categoryId)}
                                          </span>
                                          {overlapPokemon.length > 0 ? (
                                            <OverlapTooltip
                                              items={overlapPokemon.map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                                              tooltipKeyPrefix={`pokemon-overlap-${entry.pokemon.id}-${categoryId}-extra`}
                                            />
                                          ) : null}
                                        </span>
                                        );
                                      })
                                    : null}
                                  {hiddenFavoriteCount > 0 ? null : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </ResultCardShell>
                        </ResultCardOverflowWrapper>
                    );
                  })()
                        ))}
                        </div>
                        <SeeAllToggle
                          show={section.entries.length > MAX_POKEMON_CARDS_PER_SECTION && !isNullStateResults && !isFilteredSection && !isAlphabeticalSection}
                          isExpanded={isSectionExpanded}
                          isCollapsing={isSectionCollapsing}
                          hiddenCount={hiddenCount}
                          onToggle={() => togglePokemonSectionExpansion(sectionId)}
                        />
                      </CollapsibleResultsSection>
                    );
                  })}
                </ResultsContent>
              </>
            ) : null}

            {/* Subsection: Favorites browser */}
            {!showInitialSkeleton && contentActiveTab === "favorites" ? (
              <>
                <p className="mb-2 text-3xl font-medium tracking-[-0.04em] text-[#6c889b]">Complete Build</p>
                <p className="text-sm italic text-[#8e9aa3]">
                  Review your full setup, adjust item quantities, and track every required material in one place.
                </p>
                <div className="sticky top-0 z-10 mt-4 rounded-[12px] border border-[#C8DAE2] bg-[#D9E8EE]/95 p-2 backdrop-blur-[2px]">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "summary" as const, label: "Build Summary" },
                      { id: "items" as const, label: "Items" },
                      { id: "materials" as const, label: "Materials" },
                      { id: "coverage" as const, label: "Coverage" },
                    ].map((section) => (
                      <button
                        key={`complete-build-nav-${section.id}`}
                        type="button"
                        onClick={() => scrollToCompleteBuildSection(section.id)}
                        className={`pk-btn pk-btn-sm rounded-[10px] ${
                          activeCompleteBuildSection === section.id
                            ? "pk-btn-secondary border-[#65AADA] bg-white text-[#3f6478]"
                            : "pk-btn-soft border-[#c8dae2] bg-[#eef5f8] text-[#5d7f91] hover:border-[#65AADA]"
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
                <section ref={completeBuildSummaryRef} className="mt-4 grid gap-3 scroll-mt-20 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[14px] border border-[#C8DAE2] bg-white p-3">
                    <p className="text-xs uppercase text-[#8e9aa3]">Pokemon</p>
                    <p className="text-xl font-extrabold tracking-[-0.02em] text-[#485864]">{selectedPokemon.length}</p>
                  </div>
                  <div className="rounded-[14px] border border-[#C8DAE2] bg-white p-3">
                    <p className="text-xs uppercase text-[#8e9aa3]">Items</p>
                    <p className="text-xl font-extrabold tracking-[-0.02em] text-[#485864]">{totalItemQuantity}</p>
                  </div>
                  <div className="rounded-[14px] border border-[#C8DAE2] bg-white p-3">
                    <p className="text-xs uppercase text-[#8e9aa3]">Materials Needed</p>
                    <p className="text-xl font-extrabold tracking-[-0.02em] text-[#485864]">{buildProgressSummary.totalMaterialPiecesNeeded}</p>
                  </div>
                  <div className="rounded-[14px] border border-[#C8DAE2] bg-white p-3">
                    <p className="text-xs uppercase text-[#8e9aa3]">Completion</p>
                    <p className="text-xl font-extrabold tracking-[-0.02em] text-[#485864]">{buildProgressSummary.completionPercentage}%</p>
                  </div>
                </section>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_1fr]">
                  <section ref={completeBuildItemsRef} className="rounded-[16px] border border-[#C8DAE2] bg-[#eaf3f7] p-4 scroll-mt-20">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#5D7F91]">Build Items</h3>
                      <p className="text-xs text-[#6c889b]">Tap + / - to change quantities</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {buildItemEntries.map((entry) => (
                        <article key={`complete-build-item-${entry.itemId}`} className="rounded-[14px] border border-[#C8DAE2] bg-white p-3">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#fff1e3] p-1.5">
                              {entry.item.image ? <img src={entry.item.image} alt={entry.itemName} className="h-9 w-9 object-contain" /> : null}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-lg font-semibold tracking-[-0.02em] text-[#485864]">{entry.itemName}</p>
                              <p className="text-xs text-[#6c889b]">{entry.item.generalCategoryLabel ?? "Misc."}</p>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => dispatch({ type: "home/remove-item", itemId: entry.itemId })}
                                className="pk-btn pk-btn-secondary pk-btn-icon pk-btn-sm text-[#6c889b]"
                                aria-label={`Decrease ${entry.itemName}`}
                              >
                                −
                              </button>
                              <span className="min-w-6 text-center text-sm font-semibold text-[#485864]">{entry.quantityInBuild}</span>
                              <button
                                type="button"
                                onClick={() => dispatch({ type: "home/add-item", itemId: entry.itemId })}
                                className="pk-btn pk-btn-secondary pk-btn-icon pk-btn-sm text-[#6c889b]"
                                aria-label={`Increase ${entry.itemName}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                      {buildItemEntries.length === 0 ? (
                        <div className="rounded-[14px] border border-dashed border-[#b3c9d2] bg-white p-3">
                          <p className="text-sm italic text-[#8e9aa3]">No items added yet.</p>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section ref={completeBuildMaterialsRef} className="rounded-[16px] border border-[#C8DAE2] bg-[#eaf3f7] p-4 scroll-mt-20">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#5D7F91]">Materials Tracker</h3>
                      <p className="text-xs text-[#6c889b]">
                        {buildProgressSummary.totalMaterialPiecesOwnedEffective}/{buildProgressSummary.totalMaterialPiecesNeeded} collected
                      </p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-[#219DF4] transition-[width] duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, buildProgressSummary.completionPercentage))}%` }}
                      />
                    </div>
                    <div className="mt-3 space-y-2">
                      {materialProgressEntries.map((entry) => (
                        <article key={`complete-build-material-${entry.materialId}`} className="rounded-[14px] border border-[#C8DAE2] bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-[#485864]">{entry.materialName}</p>
                              <p className="text-xs text-[#6c889b]">
                                {entry.ownedQuantity}/{entry.totalNeeded} owned
                                {entry.remainingQuantity > 0 ? ` · ${entry.remainingQuantity} remaining` : " · Complete"}
                              </p>
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => dispatch({ type: "home/material-progress/increment", materialId: entry.materialId, delta: -1 })}
                                className="pk-btn pk-btn-secondary pk-btn-icon pk-btn-sm text-[#6c889b]"
                                aria-label={`Decrease ${entry.materialName}`}
                              >
                                −
                              </button>
                              <button
                                type="button"
                                onClick={() => dispatch({ type: "home/material-progress/increment", materialId: entry.materialId, delta: 1 })}
                                className="pk-btn pk-btn-secondary pk-btn-icon pk-btn-sm text-[#6c889b]"
                                aria-label={`Increase ${entry.materialName}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                      {materialProgressEntries.length === 0 ? (
                        <div className="rounded-[14px] border border-dashed border-[#b3c9d2] bg-white p-3">
                          <p className="text-sm italic text-[#8e9aa3]">No materials required yet.</p>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>

                {totalFavoriteItems > 0 ? (
                  <section ref={completeBuildCoverageRef} className="mt-5 rounded-[16px] border border-[#C8DAE2] bg-[#eaf3f7] p-4 scroll-mt-20">
                    <h3 className="text-lg font-extrabold tracking-[-0.02em] text-[#5D7F91]">Helpful Item Picks</h3>
                    <p className="mt-1 text-sm text-[#6c889b]">Optional additions based on your selected favorites.</p>
                    <div className="mt-3 grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                      {favoriteSections
                        .flatMap((section) => section.items)
                        .slice(0, 6)
                        .map((entry) => (
                          <article
                            key={`complete-build-pick-${entry.item.id}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => dispatch({ type: "home/add-item", itemId: entry.item.id })}
                            onKeyDown={(event) => activateWithKeyboard(event, () => dispatch({ type: "home/add-item", itemId: entry.item.id }))}
                            className="rounded-[14px] border border-[#C8DAE2] bg-white p-3"
                          >
                            <p className="text-base font-semibold tracking-[-0.02em] text-[#485864]">{entry.item.name}</p>
                          </article>
                        ))}
                    </div>
                  </section>
                ) : (
                  <section ref={completeBuildCoverageRef} className="mt-5 rounded-[16px] border border-dashed border-[#C8DAE2] bg-[#eaf3f7] p-4 scroll-mt-20">
                    <h3 className="text-lg font-extrabold tracking-[-0.02em] text-[#5D7F91]">Coverage</h3>
                    <p className="mt-1 text-sm text-[#8e9aa3]">No additional favorite-based suggestions right now.</p>
                  </section>
                )}
              </>
            ) : null}
            </div>

          </div>
        </section>
      </div>
      </div>

      {/* Section: Mobile sticky context toggle */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--pk-border)] bg-[var(--pk-canvas)] md:hidden">
        <button
          type="button"
          onClick={() => dispatch({ type: state.ui.isMobileBuilderSheetOpen ? "ui/close-mobile-sheet" : "ui/open-mobile-sheet" })}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--pk-text-primary)]">Your Pokemon</span>
            {selectedPokemon.slice(0, 6).map((p) =>
              p.imageUrl ? (
                <img key={p.id} src={p.imageUrl} alt={p.name} className="h-8 w-8 object-contain" />
              ) : (
                <div key={p.id} className="h-8 w-8 rounded-full bg-[var(--pk-border)]" />
              ),
            )}
            {selectedPokemon.length > 6 && (
              <span className="text-sm font-medium text-[var(--pk-text-desc)]">+{selectedPokemon.length - 6}</span>
            )}
          </div>
          <ChevronUp className={`h-4 w-4 text-[var(--pk-text-desc)] transition-transform ${state.ui.isMobileBuilderSheetOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Section: Mobile context sheet */}
      {state.ui.isMobileBuilderSheetOpen ? (
        <div className="fixed inset-0 z-40 bg-black/35 md:hidden" onClick={() => dispatch({ type: "ui/close-mobile-sheet" })}>
          <section
            className="absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto rounded-t-3xl bg-[var(--pk-canvas)] pb-8 pt-4"
            onClick={(event) => event.stopPropagation()}
          >

            {showInitialSkeleton || isTabTransitionLoading ? (
              <div className="px-4"><BuilderSidebarSkeleton /></div>
            ) : contentActiveTab === "pokemon" ? (
              <div className="space-y-5">
                <section className="space-y-2">
                  {selectedPokemon.length > 0 ? (
                    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex gap-3 px-4 pb-2">
                        {selectedPokemon.map((pokemon) => {
                          const overlapFavoriteIds =
                            selectedPokemonFavoriteSets.excludingSelfByPokemonId.get(pokemon.id) ??
                            selectedPokemonFavoriteSets.allSelectedFavoriteIds;
                          const sharedCount = pokemon.favoriteCategoryIds.filter((categoryId) => (sharedFavoriteCounts.find(([id]) => id === categoryId)?.[1] ?? 0) > 1).length;
                          const hasFavorites = pokemon.favoriteCategoryIds.length > 0;
                          const chips = (() => {
                            if (!hasFavorites) return [];
                            const originalOrder = new Map(pokemon.favoriteCategoryIds.map((categoryId, index) => [categoryId, index]));
                            return [...pokemon.favoriteCategoryIds]
                              .sort((left, right) => {
                                const leftSharedCount = sharedFavoriteCountByCategoryId.get(left) ?? 0;
                                const rightSharedCount = sharedFavoriteCountByCategoryId.get(right) ?? 0;
                                if (leftSharedCount !== rightSharedCount) return rightSharedCount - leftSharedCount;
                                const leftOverlap = overlapFavoriteIds.has(left) ? 1 : 0;
                                const rightOverlap = overlapFavoriteIds.has(right) ? 1 : 0;
                                if (leftOverlap !== rightOverlap) return rightOverlap - leftOverlap;
                                return (originalOrder.get(left) ?? 0) - (originalOrder.get(right) ?? 0);
                              })
                              .map((categoryId) => ({
                                id: categoryId,
                                label: toCategoryLabel(categoryId),
                                isSelected: activePokemonFavoriteFilters.includes(categoryId),
                                tone: (overlapFavoriteIds.has(categoryId) ? "primary" : "default") as "primary" | "default",
                                onToggle: () =>
                                  setActivePokemonFavoriteFilters((previous) =>
                                    previous.includes(categoryId) ? previous.filter((id) => id !== categoryId) : [...previous, categoryId],
                                  ),
                              }));
                          })();
                          return (
                            <div key={`sheet-wrap-${pokemon.id}`} className="w-[80%] shrink-0">
                              <SidebarPokemonCard
                                key={`sheet-${pokemon.id}`}
                                name={pokemon.name}
                                subtitle={
                                  selectedPokemon.length >= 2 && sharedCount > 0
                                    ? `${getPreferredHabitatLabel(pokemon.idealHabitatId)} · ${sharedCount} shared favorites`
                                    : getPreferredHabitatLabel(pokemon.idealHabitatId)
                                }
                                imageUrl={pokemon.imageUrl}
                                onRemove={() => dispatch({ type: "home/remove-pokemon", pokemonId: pokemon.id })}
                                chips={chips}
                                alwaysShowRemove
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mx-4 rounded-[16px] border border-dashed border-[#b3c9d2] p-3 text-xs italic text-[#6c889b]">
                      Select Pokemon to get started.
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <p className="px-4 text-base font-extrabold tracking-[-0.02em] text-[#485864]">Preferred Habitats</p>
                  {selectedPokemon.length >= 2 && sharedHabitatCounts.length > 0 ? (
                    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex gap-1.5 px-4 pb-1">
                        {sharedHabitatCounts.map(([habitatId, count]) => (
                          <span key={`sheet-habitat-${habitatId}`} className="group/overlap relative inline-flex shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActivePokemonHabitatFilters((previous) =>
                                  previous.includes(habitatId) ? previous.filter((id) => id !== habitatId) : [...previous, habitatId],
                                )
                              }
                              className={`pk-chip pk-chip-standard transition-colors ${activePokemonHabitatFilters.includes(habitatId) ? "pk-chip-primary" : "pk-chip-surface"}`}
                            >
                              {getPreferredHabitatLabel(habitatId)} ({count})
                            </button>
                            <OverlapTooltip
                              items={selectedPokemon
                                .filter((pokemon) => pokemon.idealHabitatId === habitatId)
                                .map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                              tooltipKeyPrefix={`sheet-habitat-${habitatId}-tooltip`}
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="px-4 text-xs italic text-[#8e9aa3]">
                      {selectedPokemon.length === 0 ? "No Pokemon added yet." : selectedPokemon.length === 1 ? "Add 1 more Pokemon to see shared habitats." : "No shared habitats yet."}
                    </p>
                  )}
                </section>

                <section className="space-y-2">
                  <p className="px-4 text-base font-extrabold tracking-[-0.02em] text-[#485864]">Group Overlap</p>
                  {selectedPokemon.length >= 2 && sharedFavoriteCounts.length > 0 ? (
                    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex gap-1.5 px-4 pb-1">
                        {[...sidebarPrimarySharedFavorites, ...sidebarSecondarySharedFavorites].map(([categoryId, count]) => (
                          <span key={`sheet-fav-${categoryId}`} className="group/overlap relative inline-flex shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActivePokemonFavoriteFilters((previous) =>
                                  previous.includes(categoryId) ? previous.filter((id) => id !== categoryId) : [...previous, categoryId],
                                )
                              }
                              className={`pk-chip pk-chip-standard transition-colors ${activePokemonFavoriteFilters.includes(categoryId) ? "pk-chip-primary" : "pk-chip-surface"}`}
                            >
                              {toCategoryLabel(categoryId)} ({count})
                            </button>
                            <OverlapTooltip
                              items={selectedPokemon
                                .filter((pokemon) => pokemon.favoriteCategoryIds.includes(categoryId))
                                .map((pokemon) => ({ id: pokemon.id, name: pokemon.name, imageUrl: pokemon.imageUrl }))}
                              tooltipKeyPrefix={`sheet-fav-${categoryId}-tooltip`}
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="px-4 text-xs italic text-[#8e9aa3]">
                      {selectedPokemon.length === 0 ? "No Pokemon added yet." : selectedPokemon.length === 1 ? "Add 1 more Pokemon to see group overlap." : "No shared favorites yet."}
                    </p>
                  )}
                </section>
              </div>
            ) : contentActiveTab === "items" ? (
              <div className="space-y-3 px-4">
                {renderItemsContextPanel("sheet-items")}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {/* Section: Expanded home drawer */}
      {state.ui.isExpandedHomeOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/35" onClick={() => dispatch({ type: "ui/close-expanded-home" })}>
          <section className="h-full w-full max-w-xl overflow-auto bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="type-overline text-moss/60">Expanded Home</p>
                <h3 className="type-h2 mt-1 text-ink">{state.currentHome.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "ui/close-expanded-home" })}
                className="pk-btn pk-btn-secondary pk-btn-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <div>
                <p className="type-ui type-ui-strong">Pokemon</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPokemon.map((pokemon) => (
                    <Chip key={pokemon.id}>{`${pokemon.name} · ${getPreferredHabitatLabel(pokemon.idealHabitatId)}`}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="type-ui type-ui-strong">Habitat</p>
                <div className="mt-2">{selectedHabitat ? <Chip>{selectedHabitat.name}</Chip> : <p className="type-caption text-ink/60">None selected</p>}</div>
              </div>
              <div>
                <p className="type-ui type-ui-strong">Items</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {buildItemEntries.map((entry) => (
                    <Chip key={entry.itemId}>
                      {entry.itemName} x{entry.quantityInBuild}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="type-ui type-ui-strong">Jump actions</p>
                <div className="grid gap-2">
                  <button type="button" onClick={() => goToPhase("comfort_items")} className="pk-btn pk-btn-ghost pk-btn-sm justify-start text-left">
                    Browse items
                  </button>
                  <button type="button" onClick={() => goToPhase("pokemon")} className="pk-btn pk-btn-ghost pk-btn-sm justify-start text-left">
                    Browse compatible Pokemon
                  </button>
                  <button type="button" onClick={() => goToPhase("review_materials")} className="pk-btn pk-btn-ghost pk-btn-sm justify-start text-left">
                    Complete build
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {/* Section: Transfer code modal */}
      {state.ui.isTransferModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => dispatch({ type: "ui/close-transfer" })}>
          <section className="w-full max-w-lg rounded-3xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="type-h3 text-ink">Continue on another device</h3>
            <p className="type-body mt-2 text-ink/70">Generate a restore code and enter it on your other device.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={generateRestoreCode} className="pk-btn pk-btn-primary pk-btn-md">
                Generate restore code
              </button>
              <button type="button" onClick={() => dispatch({ type: "ui/close-transfer" })} className="pk-btn pk-btn-secondary pk-btn-md">
                Close
              </button>
            </div>
            {state.session.lastGeneratedCode ? (
              <div className="mt-4 rounded-2xl border border-ink/10 bg-paper p-3">
                <p className="type-overline text-moss/65">Restore code</p>
                <p className="type-h2 mt-1 tracking-[0.08em] text-ink">{state.session.lastGeneratedCode}</p>
                {state.session.lastCodeExpiry ? (
                  <p className="type-caption mt-1 text-ink/65">Expires {new Date(state.session.lastCodeExpiry).toLocaleString()}</p>
                ) : null}
              </div>
            ) : null}
            {state.session.lastError ? <p className="type-caption mt-3 text-berry">{state.session.lastError}</p> : null}
          </section>
        </div>
      ) : null}

      {/* Section: Restore code modal */}
      {state.ui.isRestoreModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => dispatch({ type: "ui/close-restore" })}>
          <section className="w-full max-w-lg rounded-3xl bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="type-h3 text-ink">Restore from code</h3>
            <p className="type-body mt-2 text-ink/70">Enter a restore code to recover your current home and saved homes.</p>
            <input
              value={restoreCodeInput}
              onChange={(event) => setRestoreCodeInput(event.target.value.toUpperCase())}
              placeholder="MOSS-7421"
              className="type-ui mt-4 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3"
            />
            <div className="mt-3 flex items-center gap-2">
              <label className="type-caption inline-flex items-center gap-1">
                <input type="radio" checked={restoreMode === "replace"} onChange={() => setRestoreMode("replace")} /> Replace local homes
              </label>
              <label className="type-caption inline-flex items-center gap-1">
                <input type="radio" checked={restoreMode === "merge"} onChange={() => setRestoreMode("merge")} /> Merge local homes
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => restoreFromCode(restoreCodeInput, restoreMode)}
                className="pk-btn pk-btn-primary pk-btn-md"
              >
                Restore
              </button>
              <button type="button" onClick={() => dispatch({ type: "ui/close-restore" })} className="pk-btn pk-btn-secondary pk-btn-md">
                Close
              </button>
            </div>
            {state.session.lastError ? <p className="type-caption mt-3 text-berry">{state.session.lastError}</p> : null}
          </section>
        </div>
      ) : null}

      {/* Section: Entity detail overlays */}
      {state.browse.items.detailItemId ? (
        <ItemDetailOverlay
          itemId={state.browse.items.detailItemId}
          onClose={() => setItemDetail(null, { pushHistory: false })}
          onOpenItemDetail={(itemId) => setItemDetail(itemId)}
          breadcrumbItemIds={itemDetailTrail}
        />
      ) : null}
      {state.browse.pokemon.detailPokemonId ? (
        <PokemonDetailOverlay pokemonId={state.browse.pokemon.detailPokemonId} onClose={() => setPokemonDetail(null, { pushHistory: false })} />
      ) : null}
    </div>
  );
};

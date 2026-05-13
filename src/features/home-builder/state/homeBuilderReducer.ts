import {
  makeEmptyCurrentHome,
  makeSavedHomesState,
  normalizeCurrentHomeState,
  normalizeSavedHome,
  normalizeSavedHomes,
} from "../../../domain/home-builder/logic";
import type {
  BrowseTab,
  BuilderBrowseState,
  BuilderUiState,
  CurrentHomeState,
  HomeBuilderFeatureState,
  ItemBrowseIntent,
  SavedHome,
  SavedHomesState,
  SessionPortabilityState,
} from "../../../domain/home-builder/models";

const defaultBrowseState: BuilderBrowseState = {
  activeTab: "pokemon",
  items: {
    browseMode: "all",
    intent: null,
    searchQuery: "",
    generalCategoryId: null,
    comfortCategoryId: null,
    favoriteCategoryId: null,
    detailItemId: null,
  },
  pokemon: {
    browseMode: "all",
    searchQuery: "",
    typeId: null,
    favoriteCategoryId: null,
    habitatId: null,
    detailPokemonId: null,
  },
  favorites: {
    browseMode: "all",
    searchQuery: "",
    favoriteCategoryId: null,
  },
  habitats: {
    browseMode: "all",
    searchQuery: "",
    detailHabitatId: null,
  },
};

const defaultUiState: BuilderUiState = {
  isExpandedHomeOpen: false,
  isSavedHomesOpen: false,
  isMobileBuilderSheetOpen: false,
  isTransferModalOpen: false,
  isRestoreModalOpen: false,
  recentlyAddedPokemonId: null,
  recentlyAddedItemId: null,
  toast: null,
  activeMaterialHighlightId: null,
  hoveredBuildItemId: null,
};

const defaultSessionState: SessionPortabilityState = {
  exportStatus: "idle",
  importStatus: "idle",
  lastGeneratedCode: null,
  lastCodeExpiry: null,
  lastError: null,
  cloudSyncError: null,
};

export const createInitialHomeBuilderState = ({
  currentHome,
  savedHomes,
}: {
  currentHome?: CurrentHomeState | null;
  savedHomes?: SavedHome[];
} = {}): HomeBuilderFeatureState => ({
  currentHome: normalizeCurrentHomeState(currentHome ?? makeEmptyCurrentHome()),
  savedHomes: makeSavedHomesState(normalizeSavedHomes(savedHomes)),
  browse: {
    ...defaultBrowseState,
    items: {
      ...defaultBrowseState.items,
    },
    pokemon: {
      ...defaultBrowseState.pokemon,
    },
    favorites: {
      ...defaultBrowseState.favorites,
    },
    habitats: {
      ...defaultBrowseState.habitats,
    },
  },
  ui: defaultUiState,
  session: defaultSessionState,
});

const dedupe = (ids: string[]) => [...new Set(ids)];
const toSafeWholeNumber = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

const nextSavedHomesState = (savedHomes: SavedHomesState, nextHome: SavedHome, prepend = false): SavedHomesState => {
  const byId = { ...savedHomes.byId, [nextHome.id]: nextHome };
  const allIds = prepend
    ? dedupe([nextHome.id, ...savedHomes.allIds])
    : dedupe(savedHomes.allIds.includes(nextHome.id) ? savedHomes.allIds : [...savedHomes.allIds, nextHome.id]);

  return {
    byId,
    allIds,
  };
};

const cloneSavedHome = (home: SavedHome): SavedHome => ({
  ...home,
  pokemonIds: [...home.pokemonIds],
  itemIds: [...home.itemIds],
  itemQuantities: { ...home.itemQuantities },
  materialProgress: { ...home.materialProgress },
});

export type HomeBuilderAction =
  | { type: "home/set-name"; name: string }
  | { type: "home/add-pokemon"; pokemonId: string }
  | { type: "home/remove-pokemon"; pokemonId: string }
  | { type: "home/add-item"; itemId: string }
  | { type: "home/remove-item"; itemId: string }
  | { type: "home/set-item-quantity"; itemId: string; quantity: number }
  | { type: "home/material-progress/set-owned"; materialId: string; ownedQuantity: number }
  | { type: "home/material-progress/increment"; materialId: string; delta: number }
  | { type: "home/set-habitat"; habitatId: string | null }
  | { type: "home/reset" }
  | { type: "saved/save-current" }
  | { type: "saved/save-current-as-new" }
  | { type: "saved/load"; homeId: string }
  | { type: "saved/delete"; homeId: string }
  | { type: "saved/duplicate"; homeId: string }
  | { type: "saved/rename"; homeId: string; name: string }
  | { type: "browse/set-tab"; tab: BrowseTab }
  | { type: "browse/hydrate"; browse: BuilderBrowseState }
  | { type: "browse/items/set-mode"; mode: "contextual" | "all" }
  | { type: "browse/items/set-intent"; intent: ItemBrowseIntent }
  | { type: "browse/items/set-search"; query: string }
  | { type: "browse/items/set-general-category"; categoryId: string | null }
  | { type: "browse/items/set-comfort-category"; categoryId: string | null }
  | { type: "browse/items/set-favorite-category"; categoryId: string | null }
  | { type: "browse/items/set-detail"; itemId: string | null }
  | { type: "browse/pokemon/set-mode"; mode: "contextual" | "all" }
  | { type: "browse/pokemon/set-search"; query: string }
  | { type: "browse/pokemon/set-type"; typeId: string | null }
  | { type: "browse/pokemon/set-favorite-category"; categoryId: string | null }
  | { type: "browse/pokemon/set-habitat"; habitatId: string | null }
  | { type: "browse/pokemon/set-detail"; pokemonId: string | null }
  | { type: "browse/favorites/set-mode"; mode: "contextual" | "all" }
  | { type: "browse/favorites/set-search"; query: string }
  | { type: "browse/favorites/set-favorite-category"; categoryId: string | null }
  | { type: "browse/habitats/set-mode"; mode: "contextual" | "all" }
  | { type: "browse/habitats/set-search"; query: string }
  | { type: "browse/habitats/set-detail"; habitatId: string | null }
  | { type: "ui/open-expanded-home" }
  | { type: "ui/close-expanded-home" }
  | { type: "ui/open-saved-homes" }
  | { type: "ui/close-saved-homes" }
  | { type: "ui/open-mobile-sheet" }
  | { type: "ui/close-mobile-sheet" }
  | { type: "ui/open-transfer" }
  | { type: "ui/close-transfer" }
  | { type: "ui/open-restore" }
  | { type: "ui/close-restore" }
  | { type: "ui/set-active-material-highlight"; materialId: string | null }
  | { type: "ui/set-hovered-build-item"; buildItemId: string | null }
  | { type: "session/export-start" }
  | { type: "session/export-success"; code: string; expiresAt: number | null }
  | { type: "session/export-error"; message: string }
  | { type: "session/import-start" }
  | { type: "session/import-success" }
  | { type: "session/import-error"; message: string }
  | { type: "session/apply-import"; currentHome: CurrentHomeState | null; savedHomes: SavedHome[] }
  | { type: "session/cloud-sync-error"; message: string }
  | { type: "session/cloud-sync-clear-error" };

export const homeBuilderReducer = (
  state: HomeBuilderFeatureState,
  action: HomeBuilderAction,
): HomeBuilderFeatureState => {
  switch (action.type) {
    case "home/set-name":
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          name: action.name,
          isDirty: true,
        },
      };
    case "home/add-pokemon":
      if (state.currentHome.pokemonIds.includes(action.pokemonId)) return state;
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          pokemonIds: [...state.currentHome.pokemonIds, action.pokemonId],
          isDirty: true,
        },
      };
    case "home/remove-pokemon": {
      const nextPokemonIds = state.currentHome.pokemonIds.filter((pokemonId) => pokemonId !== action.pokemonId);
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          pokemonIds: nextPokemonIds,
          isDirty: true,
        },
      };
    }
    case "home/add-item":
      if (state.currentHome.itemIds.includes(action.itemId)) {
        const nextQuantity = (state.currentHome.itemQuantities[action.itemId] ?? 1) + 1;
        return {
          ...state,
          currentHome: {
            ...state.currentHome,
            itemQuantities: {
              ...state.currentHome.itemQuantities,
              [action.itemId]: nextQuantity,
            },
            isDirty: true,
          },
        };
      }
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          itemIds: [...state.currentHome.itemIds, action.itemId],
          itemQuantities: {
            ...state.currentHome.itemQuantities,
            [action.itemId]: 1,
          },
          isDirty: true,
        },
      };
    case "home/remove-item":
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          itemIds: state.currentHome.itemIds.filter((itemId) => itemId !== action.itemId),
          itemQuantities: Object.fromEntries(
            Object.entries(state.currentHome.itemQuantities).filter(([itemId]) => itemId !== action.itemId),
          ),
          isDirty: true,
        },
      };
    case "home/set-item-quantity": {
      const nextQuantity = toSafeWholeNumber(action.quantity);
      if (nextQuantity === 0) {
        return {
          ...state,
          currentHome: {
            ...state.currentHome,
            itemIds: state.currentHome.itemIds.filter((itemId) => itemId !== action.itemId),
            itemQuantities: Object.fromEntries(
              Object.entries(state.currentHome.itemQuantities).filter(([itemId]) => itemId !== action.itemId),
            ),
            isDirty: true,
          },
        };
      }

      const hasItem = state.currentHome.itemIds.includes(action.itemId);
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          itemIds: hasItem ? state.currentHome.itemIds : [...state.currentHome.itemIds, action.itemId],
          itemQuantities: {
            ...state.currentHome.itemQuantities,
            [action.itemId]: nextQuantity,
          },
          isDirty: true,
        },
      };
    }
    case "home/material-progress/set-owned": {
      const ownedQuantity = toSafeWholeNumber(action.ownedQuantity);
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          materialProgress: {
            ...state.currentHome.materialProgress,
            [action.materialId]: { ownedQuantity },
          },
          isDirty: true,
        },
      };
    }
    case "home/material-progress/increment": {
      const currentOwned = state.currentHome.materialProgress[action.materialId]?.ownedQuantity ?? 0;
      const ownedQuantity = toSafeWholeNumber(currentOwned + action.delta);
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          materialProgress: {
            ...state.currentHome.materialProgress,
            [action.materialId]: { ownedQuantity },
          },
          isDirty: true,
        },
      };
    }
    case "home/set-habitat":
      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          habitatId: action.habitatId,
          isDirty: true,
        },
      };
    case "home/reset":
      return {
        ...state,
        currentHome: makeEmptyCurrentHome(),
      };
    case "saved/save-current": {
      const now = Date.now();
      const nextId = state.currentHome.id ?? `home-${Math.random().toString(36).slice(2, 10)}`;
      const savedHome: SavedHome = {
        id: nextId,
        name: state.currentHome.name || "Untitled Home",
        pokemonIds: [...state.currentHome.pokemonIds],
        itemIds: [...state.currentHome.itemIds],
        itemQuantities: { ...state.currentHome.itemQuantities },
        materialProgress: { ...state.currentHome.materialProgress },
        habitatId: state.currentHome.habitatId,
        createdAt: state.savedHomes.byId[nextId]?.createdAt ?? now,
        updatedAt: now,
      };

      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          id: nextId,
          isDirty: false,
          lastSavedAt: now,
        },
        savedHomes: nextSavedHomesState(state.savedHomes, savedHome, true),
      };
    }
    case "saved/save-current-as-new": {
      const now = Date.now();
      const nextId = `home-${Math.random().toString(36).slice(2, 10)}`;
      const savedHome: SavedHome = {
        id: nextId,
        name: state.currentHome.name || "Untitled Home",
        pokemonIds: [...state.currentHome.pokemonIds],
        itemIds: [...state.currentHome.itemIds],
        itemQuantities: { ...state.currentHome.itemQuantities },
        materialProgress: { ...state.currentHome.materialProgress },
        habitatId: state.currentHome.habitatId,
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...state,
        currentHome: {
          ...state.currentHome,
          id: nextId,
          isDirty: false,
          lastSavedAt: now,
        },
        savedHomes: nextSavedHomesState(state.savedHomes, savedHome, true),
      };
    }
    case "saved/load": {
      const home = state.savedHomes.byId[action.homeId];
      if (!home) return state;
      return {
        ...state,
        currentHome: {
          ...normalizeCurrentHomeState({
            id: home.id,
            name: home.name,
            pokemonIds: [...home.pokemonIds],
            itemIds: [...home.itemIds],
            itemQuantities: { ...home.itemQuantities },
            materialProgress: { ...home.materialProgress },
            habitatId: home.habitatId,
            isDirty: false,
            lastSavedAt: home.updatedAt,
          }),
        },
      };
    }
    case "saved/delete": {
      if (!state.savedHomes.byId[action.homeId]) return state;
      const byId = { ...state.savedHomes.byId };
      delete byId[action.homeId];
      return {
        ...state,
        savedHomes: {
          byId,
          allIds: state.savedHomes.allIds.filter((id) => id !== action.homeId),
        },
      };
    }
    case "saved/duplicate": {
      const source = state.savedHomes.byId[action.homeId];
      if (!source) return state;
      const now = Date.now();
      const clone: SavedHome = {
        ...cloneSavedHome(source),
        id: `home-${Math.random().toString(36).slice(2, 10)}`,
        name: `${source.name} Copy`,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...state,
        savedHomes: nextSavedHomesState(state.savedHomes, normalizeSavedHome(clone), true),
      };
    }
    case "saved/rename": {
      const source = state.savedHomes.byId[action.homeId];
      if (!source) return state;
      const renamed: SavedHome = {
        ...source,
        name: action.name,
        updatedAt: Date.now(),
      };
      return {
        ...state,
        savedHomes: nextSavedHomesState(state.savedHomes, renamed),
        currentHome:
          state.currentHome.id === action.homeId
            ? {
                ...state.currentHome,
                name: action.name,
              }
            : state.currentHome,
      };
    }
    case "browse/set-tab":
      return {
        ...state,
        browse: {
          ...state.browse,
          activeTab: action.tab,
        },
      };
    case "browse/hydrate":
      return {
        ...state,
        browse: action.browse,
      };
    case "browse/items/set-mode":
      return {
        ...state,
        browse: {
          ...state.browse,
          items: {
            ...state.browse.items,
            browseMode: action.mode,
          },
        },
      };
    case "browse/items/set-intent":
      return {
        ...state,
        browse: {
          ...state.browse,
          items: {
            ...state.browse.items,
            intent: action.intent,
          },
        },
      };
    case "browse/items/set-search":
      return {
        ...state,
        browse: {
          ...state.browse,
          items: {
            ...state.browse.items,
            searchQuery: action.query,
          },
        },
      };
    case "browse/items/set-general-category":
      return {
        ...state,
        browse: {
          ...state.browse,
          items: {
            ...state.browse.items,
            generalCategoryId: action.categoryId,
          },
        },
      };
    case "browse/items/set-comfort-category":
      return {
        ...state,
        browse: {
          ...state.browse,
          items: {
            ...state.browse.items,
            comfortCategoryId: action.categoryId,
          },
        },
      };
    case "browse/items/set-favorite-category":
      return {
        ...state,
        browse: {
          ...state.browse,
          items: {
            ...state.browse.items,
            favoriteCategoryId: action.categoryId,
          },
        },
      };
    case "browse/items/set-detail":
      return {
        ...state,
        browse: {
          ...state.browse,
          items: {
            ...state.browse.items,
            detailItemId: action.itemId,
          },
        },
      };
    case "browse/pokemon/set-mode":
      return {
        ...state,
        browse: {
          ...state.browse,
          pokemon: {
            ...state.browse.pokemon,
            browseMode: action.mode,
          },
        },
      };
    case "browse/pokemon/set-search":
      return {
        ...state,
        browse: {
          ...state.browse,
          pokemon: {
            ...state.browse.pokemon,
            searchQuery: action.query,
          },
        },
      };
    case "browse/pokemon/set-type":
      return {
        ...state,
        browse: {
          ...state.browse,
          pokemon: {
            ...state.browse.pokemon,
            typeId: action.typeId,
          },
        },
      };
    case "browse/pokemon/set-favorite-category":
      return {
        ...state,
        browse: {
          ...state.browse,
          pokemon: {
            ...state.browse.pokemon,
            favoriteCategoryId: action.categoryId,
          },
        },
      };
    case "browse/pokemon/set-habitat":
      return {
        ...state,
        browse: {
          ...state.browse,
          pokemon: {
            ...state.browse.pokemon,
            habitatId: action.habitatId,
          },
        },
      };
    case "browse/pokemon/set-detail":
      return {
        ...state,
        browse: {
          ...state.browse,
          pokemon: {
            ...state.browse.pokemon,
            detailPokemonId: action.pokemonId,
          },
        },
      };
    case "browse/favorites/set-mode":
      return {
        ...state,
        browse: {
          ...state.browse,
          favorites: {
            ...state.browse.favorites,
            browseMode: action.mode,
          },
        },
      };
    case "browse/favorites/set-search":
      return {
        ...state,
        browse: {
          ...state.browse,
          favorites: {
            ...state.browse.favorites,
            searchQuery: action.query,
          },
        },
      };
    case "browse/favorites/set-favorite-category":
      return {
        ...state,
        browse: {
          ...state.browse,
          favorites: {
            ...state.browse.favorites,
            favoriteCategoryId: action.categoryId,
          },
        },
      };
    case "browse/habitats/set-mode":
      return {
        ...state,
        browse: {
          ...state.browse,
          habitats: {
            ...state.browse.habitats,
            browseMode: action.mode,
          },
        },
      };
    case "browse/habitats/set-search":
      return {
        ...state,
        browse: {
          ...state.browse,
          habitats: {
            ...state.browse.habitats,
            searchQuery: action.query,
          },
        },
      };
    case "browse/habitats/set-detail":
      return {
        ...state,
        browse: {
          ...state.browse,
          habitats: {
            ...state.browse.habitats,
            detailHabitatId: action.habitatId,
          },
        },
      };
    case "ui/open-expanded-home":
      return { ...state, ui: { ...state.ui, isExpandedHomeOpen: true } };
    case "ui/close-expanded-home":
      return { ...state, ui: { ...state.ui, isExpandedHomeOpen: false } };
    case "ui/open-saved-homes":
      return { ...state, ui: { ...state.ui, isSavedHomesOpen: true } };
    case "ui/close-saved-homes":
      return { ...state, ui: { ...state.ui, isSavedHomesOpen: false } };
    case "ui/open-mobile-sheet":
      return { ...state, ui: { ...state.ui, isMobileBuilderSheetOpen: true } };
    case "ui/close-mobile-sheet":
      return { ...state, ui: { ...state.ui, isMobileBuilderSheetOpen: false } };
    case "ui/open-transfer":
      return { ...state, ui: { ...state.ui, isTransferModalOpen: true } };
    case "ui/close-transfer":
      return { ...state, ui: { ...state.ui, isTransferModalOpen: false } };
    case "ui/open-restore":
      return { ...state, ui: { ...state.ui, isRestoreModalOpen: true } };
    case "ui/close-restore":
      return { ...state, ui: { ...state.ui, isRestoreModalOpen: false } };
    case "ui/set-active-material-highlight":
      return { ...state, ui: { ...state.ui, activeMaterialHighlightId: action.materialId } };
    case "ui/set-hovered-build-item":
      return { ...state, ui: { ...state.ui, hoveredBuildItemId: action.buildItemId } };
    case "session/export-start":
      return {
        ...state,
        session: {
          ...state.session,
          exportStatus: "loading",
          lastError: null,
        },
      };
    case "session/export-success":
      return {
        ...state,
        session: {
          ...state.session,
          exportStatus: "success",
          lastGeneratedCode: action.code,
          lastCodeExpiry: action.expiresAt,
          lastError: null,
        },
      };
    case "session/export-error":
      return {
        ...state,
        session: {
          ...state.session,
          exportStatus: "error",
          lastError: action.message,
        },
      };
    case "session/import-start":
      return {
        ...state,
        session: {
          ...state.session,
          importStatus: "loading",
          lastError: null,
        },
      };
    case "session/import-success":
      return {
        ...state,
        session: {
          ...state.session,
          importStatus: "success",
          lastError: null,
        },
      };
    case "session/import-error":
      return {
        ...state,
        session: {
          ...state.session,
          importStatus: "error",
          lastError: action.message,
        },
      };
    case "session/apply-import":
      return {
        ...state,
        currentHome: normalizeCurrentHomeState(action.currentHome ?? makeEmptyCurrentHome()),
        savedHomes: makeSavedHomesState(normalizeSavedHomes(action.savedHomes)),
      };
    case "session/cloud-sync-error":
      return { ...state, session: { ...state.session, cloudSyncError: action.message } };
    case "session/cloud-sync-clear-error":
      return { ...state, session: { ...state.session, cloudSyncError: null } };
    default:
      return state;
  }
};

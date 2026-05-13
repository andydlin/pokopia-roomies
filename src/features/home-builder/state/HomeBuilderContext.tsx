import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { entityStore } from "../../../domain/home-builder/entities";
import { makeEmptyCurrentHome } from "../../../domain/home-builder/logic";
import type {
  BuilderBrowseState,
  HomeBuilderFeatureState,
  PersistedSessionPayload,
  SavedHome,
} from "../../../domain/home-builder/models";
import { localSessionAdapter } from "../../../lib/storage/localSessionAdapter";
import { supabaseBuildsAdapter } from "../../../lib/storage/supabaseBuildsAdapter";
import { SessionTransportError, sessionTransportAdapter } from "../../../lib/transport/sessionTransportAdapter";
import {
  createInitialHomeBuilderState,
  homeBuilderReducer,
  type HomeBuilderAction,
} from "./homeBuilderReducer";
import { useAuth } from "../../auth/AuthContext";

const toSavedHomesArray = (state: HomeBuilderFeatureState): SavedHome[] =>
  state.savedHomes.allIds.map((homeId) => state.savedHomes.byId[homeId]).filter(Boolean);

const toPersistedPayload = (state: HomeBuilderFeatureState): PersistedSessionPayload => ({
  version: 1,
  currentHome: state.currentHome,
  savedHomes: toSavedHomesArray(state),
  exportedAt: Date.now(),
});

// Snapshot of currentHome as a SavedHome for Supabase upsert.
function currentHomeAsSnapshot(state: HomeBuilderFeatureState): SavedHome | null {
  const { currentHome } = state;
  if (!currentHome.id) return null;
  const existing = state.savedHomes.byId[currentHome.id];
  return {
    id: currentHome.id,
    name: currentHome.name,
    pokemonIds: [...currentHome.pokemonIds],
    itemIds: [...currentHome.itemIds],
    itemQuantities: { ...currentHome.itemQuantities },
    materialProgress: { ...currentHome.materialProgress },
    habitatId: currentHome.habitatId,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
}

type HomeBuilderContextValue = {
  entities: typeof entityStore;
  state: HomeBuilderFeatureState;
  localSaveStatus: "saving" | "saved";
  lastLocalSaveAt: number | null;
  dispatch: (action: HomeBuilderAction) => void;
  setBrowseStateFromRoute: (browse: BuilderBrowseState) => void;
  saveCurrentHome: () => void;
  saveCurrentHomeAsNew: () => void;
  loadSavedHome: (homeId: string) => void;
  duplicateSavedHome: (homeId: string) => void;
  deleteSavedHome: (homeId: string) => void;
  renameSavedHome: (homeId: string, name: string) => void;
  addSavedHome: (home: SavedHome) => void;
  generateRestoreCode: () => Promise<void>;
  restoreFromCode: (code: string, mode: "replace" | "merge") => Promise<void>;
};

const HomeBuilderContext = createContext<HomeBuilderContextValue | null>(null);

export const HomeBuilderProvider = ({
  children,
  initialPayload,
}: {
  children: React.ReactNode;
  initialPayload: PersistedSessionPayload;
}) => {
  const { authState } = useAuth();

  const [state, dispatch] = useReducer(
    homeBuilderReducer,
    undefined,
    () =>
      createInitialHomeBuilderState({
        currentHome: initialPayload.currentHome,
        savedHomes: initialPayload.savedHomes,
      }),
  );

  const [localSaveStatus, setLocalSaveStatus] = useReducer(
    (_: "saving" | "saved", next: "saving" | "saved") => next,
    "saved",
  );
  const [lastLocalSaveAt, setLastLocalSaveAt] = useReducer((_prev: number | null, next: number | null) => next, null);

  // 250ms localStorage debounce — always runs as crash-recovery draft.
  useEffect(() => {
    setLocalSaveStatus("saving");
    const timeout = window.setTimeout(() => {
      localSessionAdapter.save(toPersistedPayload(state));
      setLocalSaveStatus("saved");
      setLastLocalSaveAt(Date.now());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [state]);

  // 3s Supabase debounce — only for authenticated users with a dirty named build.
  useEffect(() => {
    if (authState.status !== "authenticated") return;
    if (!state.currentHome.isDirty || !state.currentHome.id) return;

    const snapshot = currentHomeAsSnapshot(state);
    if (!snapshot) return;

    const userId = authState.user.id;
    const timeout = window.setTimeout(async () => {
      try {
        await supabaseBuildsAdapter.saveBuild(userId, snapshot);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to sync build.";
        dispatch({ type: "session/cloud-sync-error", message });
      }
    }, 3000);

    return () => window.clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentHome, authState.status, authState.status === "authenticated" ? (authState as { status: "authenticated"; user: { id: string } }).user.id : null]);

  const setBrowseStateFromRoute = useCallback((browse: BuilderBrowseState) => {
    dispatch({ type: "browse/hydrate", browse });
  }, []);

  // Helper to fire a Supabase write after an optimistic dispatch.
  const syncAfterDispatch = useCallback(
    async (op: () => Promise<void>) => {
      if (authState.status !== "authenticated") return;
      try {
        await op();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to sync build.";
        dispatch({ type: "session/cloud-sync-error", message });
      }
    },
    [authState],
  );

  const saveCurrentHome = useCallback(() => {
    dispatch({ type: "saved/save-current" });
    // The 3s debounce will pick up the dirty→clean transition and sync.
  }, []);

  const saveCurrentHomeAsNew = useCallback(() => {
    dispatch({ type: "saved/save-current-as-new" });
    // New build will be synced by the 3s debounce on next dirty write.
    // For immediate persistence, we do a best-effort sync here too.
    void syncAfterDispatch(async () => {
      if (authState.status !== "authenticated") return;
      const snapshot = currentHomeAsSnapshot(state);
      if (snapshot) await supabaseBuildsAdapter.saveBuild(authState.user.id, snapshot);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncAfterDispatch, authState, state]);

  const loadSavedHome = useCallback((homeId: string) => dispatch({ type: "saved/load", homeId }), []);

  const duplicateSavedHome = useCallback(
    (homeId: string) => {
      dispatch({ type: "saved/duplicate", homeId });
      void syncAfterDispatch(async () => {
        if (authState.status !== "authenticated") return;
        // The duplicated home gets a new ID generated by the reducer. We need
        // to read the resulting state to find it — we can't do that here, so
        // we instead rely on the 3s debounce after the user first modifies it.
        // For immediate persistence of the copy, duplicate via Supabase directly.
        const original = state.savedHomes.byId[homeId];
        if (!original) return;
        const copy: SavedHome = {
          ...original,
          id: `home-${Math.random().toString(36).slice(2, 10)}`,
          name: `${original.name} Copy`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await supabaseBuildsAdapter.saveBuild(authState.user.id, copy);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncAfterDispatch, authState, state.savedHomes],
  );

  const deleteSavedHome = useCallback(
    (homeId: string) => {
      dispatch({ type: "saved/delete", homeId });
      void syncAfterDispatch(async () => {
        if (authState.status !== "authenticated") return;
        await supabaseBuildsAdapter.deleteBuild(authState.user.id, homeId);
      });
    },
    [syncAfterDispatch, authState],
  );

  const addSavedHome = useCallback(
    (home: SavedHome) => {
      dispatch({ type: "saved/add", home });
      void syncAfterDispatch(async () => {
        if (authState.status !== "authenticated") return;
        await supabaseBuildsAdapter.saveBuild(authState.user.id, home);
      });
    },
    [syncAfterDispatch, authState],
  );

  const renameSavedHome = useCallback(
    (homeId: string, name: string) => {
      dispatch({ type: "saved/rename", homeId, name });
      void syncAfterDispatch(async () => {
        if (authState.status !== "authenticated") return;
        const home = state.savedHomes.byId[homeId];
        if (!home) return;
        await supabaseBuildsAdapter.saveBuild(authState.user.id, { ...home, name, updatedAt: Date.now() });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncAfterDispatch, authState, state.savedHomes],
  );

  const generateRestoreCode = useCallback(async () => {
    dispatch({ type: "session/export-start" });
    try {
      const result = await sessionTransportAdapter.exportSession(toPersistedPayload(state));
      dispatch({ type: "session/export-success", code: result.code, expiresAt: result.expiresAt ?? null });
    } catch (error) {
      const message = error instanceof SessionTransportError ? error.message : "Failed to export restore code.";
      dispatch({ type: "session/export-error", message });
    }
  }, [state]);

  const restoreFromCode = useCallback(
    async (code: string, mode: "replace" | "merge") => {
      dispatch({ type: "session/import-start" });
      try {
        const imported = await sessionTransportAdapter.importSession(code);
        if (mode === "replace") {
          dispatch({
            type: "session/apply-import",
            currentHome: imported.currentHome,
            savedHomes: imported.savedHomes,
          });
        } else {
          const currentSavedHomes = toSavedHomesArray(state);
          const mergedById = new Map(currentSavedHomes.map((home) => [home.id, home]));
          imported.savedHomes.forEach((home) => {
            mergedById.set(home.id, home);
          });
          dispatch({
            type: "session/apply-import",
            currentHome: imported.currentHome ?? state.currentHome,
            savedHomes: [...mergedById.values()].sort((l, r) => r.updatedAt - l.updatedAt),
          });
        }
        dispatch({ type: "session/import-success" });
      } catch (error) {
        const message = error instanceof SessionTransportError ? error.message : "Failed to restore from code.";
        dispatch({ type: "session/import-error", message });
      }
    },
    [state],
  );

  const value = useMemo<HomeBuilderContextValue>(
    () => ({
      entities: entityStore,
      state,
      localSaveStatus,
      lastLocalSaveAt,
      dispatch,
      setBrowseStateFromRoute,
      saveCurrentHome,
      saveCurrentHomeAsNew,
      loadSavedHome,
      duplicateSavedHome,
      deleteSavedHome,
      renameSavedHome,
      addSavedHome,
      generateRestoreCode,
      restoreFromCode,
    }),
    [
      state,
      localSaveStatus,
      lastLocalSaveAt,
      setBrowseStateFromRoute,
      saveCurrentHome,
      saveCurrentHomeAsNew,
      loadSavedHome,
      duplicateSavedHome,
      deleteSavedHome,
      renameSavedHome,
      addSavedHome,
      generateRestoreCode,
      restoreFromCode,
    ],
  );

  return <HomeBuilderContext.Provider value={value}>{children}</HomeBuilderContext.Provider>;
};

export const useHomeBuilder = () => {
  const context = useContext(HomeBuilderContext);
  if (!context) {
    throw new Error("useHomeBuilder must be used within HomeBuilderProvider");
  }
  return context;
};

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
import { SessionTransportError, sessionTransportAdapter } from "../../../lib/transport/sessionTransportAdapter";
import {
  createInitialHomeBuilderState,
  homeBuilderReducer,
  type HomeBuilderAction,
} from "./homeBuilderReducer";

const toSavedHomesArray = (state: HomeBuilderFeatureState): SavedHome[] =>
  state.savedHomes.allIds.map((homeId) => state.savedHomes.byId[homeId]).filter(Boolean);

const toPersistedPayload = (state: HomeBuilderFeatureState): PersistedSessionPayload => ({
  version: 1,
  currentHome: state.currentHome,
  savedHomes: toSavedHomesArray(state),
  exportedAt: Date.now(),
});

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
  generateRestoreCode: () => Promise<void>;
  restoreFromCode: (code: string, mode: "replace" | "merge") => Promise<void>;
};

const HomeBuilderContext = createContext<HomeBuilderContextValue | null>(null);

const buildInitialState = () => {
  const local = localSessionAdapter.load();
  return createInitialHomeBuilderState({
    currentHome: local?.currentHome ?? makeEmptyCurrentHome(),
    savedHomes: local?.savedHomes ?? [],
  });
};

export const HomeBuilderProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(homeBuilderReducer, undefined, buildInitialState);
  const [localSaveStatus, setLocalSaveStatus] = useReducer(
    (_: "saving" | "saved", next: "saving" | "saved") => next,
    "saved",
  );
  const [lastLocalSaveAt, setLastLocalSaveAt] = useReducer((_prev: number | null, next: number | null) => next, null);

  useEffect(() => {
    setLocalSaveStatus("saving");
    const timeout = window.setTimeout(() => {
      localSessionAdapter.save(toPersistedPayload(state));
      setLocalSaveStatus("saved");
      setLastLocalSaveAt(Date.now());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [state]);

  const setBrowseStateFromRoute = useCallback((browse: BuilderBrowseState) => {
    dispatch({ type: "browse/hydrate", browse });
  }, []);

  const saveCurrentHome = useCallback(() => dispatch({ type: "saved/save-current" }), []);
  const saveCurrentHomeAsNew = useCallback(() => dispatch({ type: "saved/save-current-as-new" }), []);
  const loadSavedHome = useCallback((homeId: string) => dispatch({ type: "saved/load", homeId }), []);
  const duplicateSavedHome = useCallback((homeId: string) => dispatch({ type: "saved/duplicate", homeId }), []);
  const deleteSavedHome = useCallback((homeId: string) => dispatch({ type: "saved/delete", homeId }), []);
  const renameSavedHome = useCallback((homeId: string, name: string) => dispatch({ type: "saved/rename", homeId, name }), []);

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
            savedHomes: [...mergedById.values()].sort((left, right) => right.updatedAt - left.updatedAt),
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

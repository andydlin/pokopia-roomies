import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { localSessionAdapter } from "../../../lib/storage/localSessionAdapter";
import { supabaseBuildsAdapter } from "../../../lib/storage/supabaseBuildsAdapter";
import { makeEmptyCurrentHome } from "../../../domain/home-builder/logic";
import type { PersistedSessionPayload } from "../../../domain/home-builder/models";
import { HomeBuilderProvider } from "./HomeBuilderContext";

const emptyPayload = (): PersistedSessionPayload => ({
  version: 1,
  currentHome: makeEmptyCurrentHome(),
  savedHomes: [],
  exportedAt: Date.now(),
});

// Loads the right initial data (localStorage for guests, Supabase for
// authenticated users) and provides it to HomeBuilderProvider.
// When auth status changes the provider is remounted with fresh data.
export const HomeBuilderLoader = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const [payload, setPayload] = useState<PersistedSessionPayload | null>(null);

  useEffect(() => {
    if (authState.status === "loading") return;

    setPayload(null); // show skeleton while fetching

    if (authState.status === "guest") {
      setPayload(localSessionAdapter.load() ?? emptyPayload());
      return;
    }

    // Authenticated: load saved builds from Supabase (currentHome draft from localStorage).
    supabaseBuildsAdapter
      .load(authState.user.id)
      .then(setPayload)
      .catch(() => {
        // Fall back to localStorage on network error.
        setPayload(localSessionAdapter.load() ?? emptyPayload());
      });
  }, [authState.status, authState.status === "authenticated" ? (authState as { status: "authenticated"; user: { id: string } }).user.id : null]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Show nothing while auth is still being determined or data is loading.
  // The app shell skeleton in App.tsx covers this period.
  if (authState.status === "loading" || payload === null) return null;

  // Key on the user ID so the provider remounts when the account changes
  // (guest ↔ authenticated), giving it a clean initial state each time.
  const providerKey =
    authState.status === "authenticated" ? `auth-${authState.user.id}` : "guest";

  return (
    <HomeBuilderProvider key={providerKey} initialPayload={payload}>
      {children}
    </HomeBuilderProvider>
  );
};

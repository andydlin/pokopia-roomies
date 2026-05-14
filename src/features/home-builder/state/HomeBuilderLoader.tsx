import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { localSessionAdapter } from "../../../lib/storage/localSessionAdapter";
import { makeEmptyCurrentHome } from "../../../domain/home-builder/logic";
import type { PersistedSessionPayload } from "../../../domain/home-builder/models";
import { HomeBuilderProvider } from "./HomeBuilderContext";

const emptyPayload = (): PersistedSessionPayload => ({
  version: 1,
  currentHome: makeEmptyCurrentHome(),
  savedHomes: [],
  exportedAt: Date.now(),
});

// Loads from localStorage immediately — no auth wait needed.
// Background Supabase sync happens inside HomeBuilderContext after auth resolves.
export const HomeBuilderLoader = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const [payload] = useState(() => localSessionAdapter.load() ?? emptyPayload());

  const providerKey =
    authState.status === "authenticated" ? `auth-${authState.user.id}` : "guest";

  return (
    <HomeBuilderProvider key={providerKey} initialPayload={payload}>
      {children}
    </HomeBuilderProvider>
  );
};

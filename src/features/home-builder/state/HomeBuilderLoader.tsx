import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { localSessionAdapter } from "../../../lib/storage/localSessionAdapter";
import { supabaseBuildsAdapter } from "../../../lib/storage/supabaseBuildsAdapter";
import { makeEmptyCurrentHome } from "../../../domain/home-builder/logic";
import type { PersistedSessionPayload } from "../../../domain/home-builder/models";
import { HomeBuilderProvider } from "./HomeBuilderContext";

// Shown while auth or data is loading — matches the builder's general shape.
const BuilderPageSkeleton = () => (
  <div className="w-full">
    <div className="border-b border-[var(--pk-border)] bg-[var(--pk-brand-light)] px-5 py-3 sm:px-8 lg:px-10">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="pk-skeleton h-8 w-20 rounded-[6px]" />
        ))}
      </div>
    </div>
    <div className="px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-6 flex gap-3">
        <div className="pk-skeleton h-10 w-full max-w-sm rounded-xl" />
        <div className="pk-skeleton h-10 w-32 rounded-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="pk-skeleton h-[88px] rounded-[14px]" />
        ))}
      </div>
    </div>
  </div>
);

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

  // Show a content skeleton while auth or data is loading.
  if (authState.status === "loading" || payload === null) return <BuilderPageSkeleton />;

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

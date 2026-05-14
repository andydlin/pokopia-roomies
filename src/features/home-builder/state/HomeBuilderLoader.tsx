import { useEffect, useState } from "react";
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

// Shown while auth is loading — matches the builder's general shape.
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

// Loads initial data from localStorage immediately (fast for both guest and authenticated
// users). Authenticated users get a background Supabase sync via HomeBuilderContext which
// refreshes savedHomes without blocking the initial render.
export const HomeBuilderLoader = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const [payload, setPayload] = useState<PersistedSessionPayload | null>(null);

  useEffect(() => {
    if (authState.status === "loading") return;
    setPayload(localSessionAdapter.load() ?? emptyPayload());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status, authState.status === "authenticated" ? (authState as { status: "authenticated"; user: { id: string } }).user.id : null]);

  if (authState.status === "loading" || payload === null) return <BuilderPageSkeleton />;

  const providerKey =
    authState.status === "authenticated" ? `auth-${authState.user.id}` : "guest";

  return (
    <HomeBuilderProvider key={providerKey} initialPayload={payload}>
      {children}
    </HomeBuilderProvider>
  );
};

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";
import { entityStore } from "../../../domain/home-builder/entities";
import {
  getBuildItemEntries,
  getBuildMaterialProgressEntries,
  getBuildProgressSummary,
} from "../../../domain/home-builder/materialPlanning";
import { favoriteCategories } from "../../../data/favoriteCategories";
import type { CurrentHomeState } from "../../../domain/home-builder/models";
import { useAuth } from "../../auth/AuthContext";
import { useHomeBuilder } from "../../home-builder/state/HomeBuilderContext";
import { SignUpUpsellModal } from "../../auth/components/SignUpUpsellModal";

// ─── Types ───────────────────────────────────────────────────────────────────

type FetchedBuild = {
  id: string;
  name: string;
  pokemon_ids: string[];
  item_ids: string[];
  item_quantities: Record<string, number>;
  material_progress: Record<string, { ownedQuantity: number }>;
  habitat_id: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
  profiles: { nickname: string } | null;
};

type BuildHome = CurrentHomeState & { createdAt: number; updatedAt: number; ownerNickname: string | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toHabitatLabel = (habitatId: string | null, habitatsById: Record<string, { name: string }>) =>
  habitatId ? habitatsById[habitatId]?.name ?? "Unknown" : null;

const toFavoriteLabel = (categoryId: string) =>
  favoriteCategories.find((entry) => entry.id === categoryId)?.name ??
  categoryId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function rowToBuildHome(row: FetchedBuild): BuildHome {
  return {
    id: row.id,
    name: row.name,
    pokemonIds: row.pokemon_ids,
    itemIds: row.item_ids,
    itemQuantities: (row.item_quantities ?? {}) as Record<string, number>,
    materialProgress: (row.material_progress ?? {}) as Record<string, { ownedQuantity: number }>,
    habitatId: row.habitat_id,
    isDirty: false,
    lastSavedAt: new Date(row.updated_at).getTime(),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    ownerNickname: row.profiles?.nickname ?? null,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; build: BuildHome };

export const PublicBuildPage = () => {
  const { buildId } = useParams<{ buildId: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { addSavedHome } = useHomeBuilder();
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });
  const [showUpsell, setShowUpsell] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!buildId) {
      setFetchState({ status: "error", message: "No build ID provided." });
      return;
    }
    let cancelled = false;
    supabase
      .from("builds")
      .select("*, profiles(nickname)")
      .eq("id", buildId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setFetchState({ status: "error", message: "Build not found." });
          return;
        }
        setFetchState({ status: "loaded", build: rowToBuildHome(data as unknown as FetchedBuild) });
      });
    return () => {
      cancelled = true;
    };
  }, [buildId]);

  const build = fetchState.status === "loaded" ? fetchState.build : null;

  const selectedPokemon = useMemo(
    () => (build ? build.pokemonIds.map((id) => entityStore.pokemonById[id]).filter(Boolean) : []),
    [build],
  );
  const buildItems = useMemo(
    () => (build ? getBuildItemEntries(build, entityStore) : []),
    [build],
  );
  const materialEntries = useMemo(
    () => (build ? getBuildMaterialProgressEntries(build, entityStore) : []),
    [build],
  );
  const progressSummary = useMemo(
    () => (build ? getBuildProgressSummary(build, entityStore) : null),
    [build],
  );

  const sharedFavoriteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedPokemon.forEach((pokemon) => {
      pokemon.favoriteCategoryIds.forEach((categoryId) => {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      });
    });
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || toFavoriteLabel(a[0]).localeCompare(toFavoriteLabel(b[0])),
    );
  }, [selectedPokemon]);

  const groupOverlapFavorites = useMemo(
    () => sharedFavoriteCounts.filter(([, count]) => count >= 2),
    [sharedFavoriteCounts],
  );

  const sharedHabitatCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedPokemon.forEach((pokemon) => {
      const habitatId = pokemon.idealHabitatId;
      if (!habitatId) return;
      counts.set(habitatId, (counts.get(habitatId) ?? 0) + 1);
    });
    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          (toHabitatLabel(a[0], entityStore.habitatsById) ?? "").localeCompare(
            toHabitatLabel(b[0], entityStore.habitatsById) ?? "",
          ),
      );
  }, [selectedPokemon]);

  const handleCopyToAccount = async () => {
    if (!build) return;
    if (authState.status !== "authenticated") {
      setShowUpsell(true);
      return;
    }
    setCopying(true);
    try {
      const copy = {
        id: `home-${Math.random().toString(36).slice(2, 10)}`,
        name: build.name,
        pokemonIds: [...build.pokemonIds],
        itemIds: [...build.itemIds],
        itemQuantities: { ...build.itemQuantities },
        materialProgress: { ...build.materialProgress },
        habitatId: build.habitatId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addSavedHome(copy);
      navigate("/homes");
    } finally {
      setCopying(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (fetchState.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-[14px] text-[#6c889b]">Loading build…</p>
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[18px] font-bold text-[#485864]">Build not found</p>
        <p className="text-[14px] text-[#6c889b]">{fetchState.message}</p>
        <Link to="/builder" className="rounded-[12px] border border-[#b3c9d2] bg-white px-4 py-2 text-[12px] font-semibold text-[#5D7F91]">
          Open Home Builder
        </Link>
      </div>
    );
  }

  return (
    <>
      {showUpsell && (
        <SignUpUpsellModal
          onClose={() => setShowUpsell(false)}
          title="Sign up to copy this build"
          body="Create a free account to save this build to your collection and keep planning."
        />
      )}

      <div className="space-y-4">
        {/* Header */}
        <section className="rounded-[20px] border border-[#d9e2e5] bg-white px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c889b]">
                Shared Build{build.ownerNickname ? ` · by ${build.ownerNickname}` : ""}
              </p>
              <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#485864]">{build.name}</h2>
            </div>
            <button
              type="button"
              onClick={handleCopyToAccount}
              disabled={copying}
              className="rounded-[12px] border border-[#b3c9d2] bg-white px-4 py-2 text-[12px] font-semibold text-[#5D7F91] disabled:opacity-50"
            >
              {copying ? "Copying…" : "Copy to my account"}
            </button>
          </div>

          {progressSummary && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[12px] bg-[#d4e5ec] px-3 py-2">
                <p className="text-[12px] uppercase text-[#6c889b]">Pokemon</p>
                <p className="text-[16px] font-bold text-[#485864]">{selectedPokemon.length}</p>
              </div>
              <div className="rounded-[12px] bg-[#d4e5ec] px-3 py-2">
                <p className="text-[12px] uppercase text-[#6c889b]">Items Placed</p>
                <p className="text-[16px] font-bold text-[#485864]">{buildItems.reduce((sum, item) => sum + item.quantityInBuild, 0)}</p>
              </div>
              <div className="rounded-[12px] bg-[#d4e5ec] px-3 py-2">
                <p className="text-[12px] uppercase text-[#6c889b]">Unique Materials</p>
                <p className="text-[16px] font-bold text-[#485864]">{progressSummary.totalMaterials}</p>
              </div>
              <div className="rounded-[12px] bg-[#d4e5ec] px-3 py-2">
                <p className="text-[12px] uppercase text-[#6c889b]">Material Pieces</p>
                <p className="text-[16px] font-bold text-[#485864]">{progressSummary.totalMaterialPiecesNeeded}</p>
              </div>
            </div>
          )}
        </section>

        {/* Group compatibility */}
        <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
          <h3 className="text-[18px] font-extrabold text-[#485864]">Group Compatibility</h3>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-[14px] bg-[#d4e5ec] p-3">
              <p className="text-[14px] font-semibold text-[#485864]">Group Overlap Favorites</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {groupOverlapFavorites.length > 0
                  ? groupOverlapFavorites.map(([categoryId, count]) => (
                      <span key={categoryId} className="pk-chip pk-chip-standard pk-chip-primary">
                        {toFavoriteLabel(categoryId)} ({count})
                      </span>
                    ))
                  : <p className="text-[12px] italic text-[#6c889b]">No shared favorites.</p>}
              </div>
            </div>
            <div className="rounded-[14px] bg-[#d4e5ec] p-3">
              <p className="text-[14px] font-semibold text-[#485864]">Shared Habitats</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sharedHabitatCounts.length > 0
                  ? sharedHabitatCounts.map(([habitatId, count]) => (
                      <span key={habitatId} className="pk-chip pk-chip-standard pk-chip-primary">
                        {toHabitatLabel(habitatId, entityStore.habitatsById)} ({count})
                      </span>
                    ))
                  : <p className="text-[12px] italic text-[#6c889b]">No shared habitats.</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Pokemon / Items / Materials columns */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
            <h3 className="text-[18px] font-extrabold text-[#485864]">Pokemon ({selectedPokemon.length})</h3>
            <div className="mt-3 space-y-2">
              {selectedPokemon.map((pokemon) => (
                <article key={pokemon.id} className="flex items-center gap-3 rounded-[14px] bg-[#d4e5ec] p-2.5">
                  <span className="inline-flex items-center justify-center rounded-[14px] bg-[#fff1e3] p-2">
                    {pokemon.imageUrl
                      ? <img src={pokemon.imageUrl} alt={pokemon.name} className="h-10 w-10 object-contain" />
                      : null}
                  </span>
                  <div>
                    <p className="text-[18px] font-semibold text-[#485864]">{pokemon.name}</p>
                    <p className="text-[12px] text-[#6c889b]">
                      {toHabitatLabel(pokemon.idealHabitatId, entityStore.habitatsById) ?? "—"}
                    </p>
                  </div>
                </article>
              ))}
              {selectedPokemon.length === 0 && (
                <p className="text-[12px] italic text-[#8e9aa3]">No Pokemon in this build.</p>
              )}
            </div>
          </section>

          <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
            <h3 className="text-[18px] font-extrabold text-[#485864]">
              Items ({buildItems.reduce((sum, item) => sum + item.quantityInBuild, 0)})
            </h3>
            <div className="mt-3 space-y-2">
              {buildItems.map((entry) => (
                <div key={entry.itemId} className="flex items-center gap-3 rounded-[14px] bg-[#d4e5ec] p-2.5">
                  <span className="inline-flex items-center justify-center rounded-[14px] bg-[#fff1e3] p-2">
                    {entry.item.image
                      ? <img src={entry.item.image} alt={entry.itemName} className="h-10 w-10 object-contain" />
                      : null}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-[#485864]">{entry.itemName}</p>
                    <p className="text-[12px] text-[#6c889b]">Qty: {entry.quantityInBuild}</p>
                  </div>
                </div>
              ))}
              {buildItems.length === 0 && (
                <p className="text-[12px] italic text-[#8e9aa3]">No items in this build.</p>
              )}
            </div>
          </section>

          <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
            <h3 className="text-[18px] font-extrabold text-[#485864]">
              Materials ({materialEntries.length})
            </h3>
            <div className="mt-3 space-y-2">
              {materialEntries.map((entry) => (
                <div key={entry.materialId} className="rounded-[14px] bg-[#d4e5ec] p-2.5">
                  <p className="text-[14px] font-semibold text-[#485864]">{entry.materialName}</p>
                  <p className="mt-0.5 text-[12px] text-[#6c889b]">{entry.totalNeeded} pieces needed</p>
                </div>
              ))}
              {materialEntries.length === 0 && (
                <p className="text-[12px] italic text-[#8e9aa3]">No materials required.</p>
              )}
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="flex justify-center gap-3 pb-4">
          <button
            type="button"
            onClick={handleCopyToAccount}
            disabled={copying}
            className="rounded-full bg-[#5D7F91] px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {copying ? "Copying…" : "Copy to my account"}
          </button>
          <Link
            to="/builder"
            className="rounded-full border border-[#b3c9d2] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#5D7F91]"
          >
            Open Home Builder
          </Link>
        </div>
      </div>
    </>
  );
};

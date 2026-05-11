import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBuildItemEntries,
  getBuildMaterialAggregation,
  getBuildMaterialProgressEntries,
  getBuildProgressSummary,
  getMaterialIdsForBuildItem,
} from "../../../domain/home-builder/materialPlanning";
import { favoriteCategories } from "../../../data/favoriteCategories";
import { useHomeBuilder } from "../state/HomeBuilderContext";

const toHabitatLabel = (habitatId: string | null, habitatsById: Record<string, { name: string }>) =>
  habitatId ? habitatsById[habitatId]?.name ?? "Unknown" : "Unknown";

const toFavoriteLabel = (categoryId: string) =>
  favoriteCategories.find((entry) => entry.id === categoryId)?.name ??
  categoryId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const BuildViewPage = () => {
  const { state, entities, dispatch } = useHomeBuilder();
  const navigate = useNavigate();
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const selectedPokemon = useMemo(
    () => state.currentHome.pokemonIds.map((pokemonId) => entities.pokemonById[pokemonId]).filter(Boolean),
    [state.currentHome.pokemonIds, entities],
  );
  const buildItems = useMemo(() => getBuildItemEntries(state.currentHome, entities), [state.currentHome, entities]);
  const materialEntries = useMemo(() => getBuildMaterialProgressEntries(state.currentHome, entities), [state.currentHome, entities]);
  const materialAggregation = useMemo(() => getBuildMaterialAggregation(state.currentHome, entities), [state.currentHome, entities]);
  const progressSummary = useMemo(() => getBuildProgressSummary(state.currentHome, entities), [state.currentHome, entities]);

  const sharedFavoriteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    selectedPokemon.forEach((pokemon) => {
      pokemon.favoriteCategoryIds.forEach((categoryId) => {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      });
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1] || toFavoriteLabel(left[0]).localeCompare(toFavoriteLabel(right[0])));
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
      .sort((left, right) => right[1] - left[1] || toHabitatLabel(left[0], entities.habitatsById).localeCompare(toHabitatLabel(right[0], entities.habitatsById)));
  }, [selectedPokemon, entities.habitatsById]);
  const activeMaterialItemIdSet = useMemo(() => {
    if (!activeMaterialId) return new Set<string>();
    const material = materialAggregation.find((entry) => entry.materialId === activeMaterialId);
    return new Set((material?.contributors ?? []).map((contributor) => contributor.itemId));
  }, [activeMaterialId, materialAggregation]);
  const activeItemMaterialIdSet = useMemo(
    () => (activeItemId ? getMaterialIdsForBuildItem(state.currentHome, entities, activeItemId) : new Set<string>()),
    [activeItemId, state.currentHome, entities],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#d9e2e5] bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-[0.08em] text-[#6c889b]">Build View</p>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#485864]">{state.currentHome.name}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/builder/pokemon")}
            className="rounded-[12px] border border-[#b3c9d2] bg-white px-4 py-2 text-[12px] font-semibold text-[#5D7F91]"
          >
            Edit
          </button>
        </div>
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
            <p className="text-[16px] font-bold text-[#485864]">
              {progressSummary.totalMaterialPiecesOwnedEffective}/{progressSummary.totalMaterialPiecesNeeded}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
        <h3 className="text-[18px] font-extrabold text-[#485864]">Group Compatibility Snapshot</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[14px] bg-[#d4e5ec] p-3">
            <p className="text-[14px] font-semibold text-[#485864]">Group Overlap Favorites</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {groupOverlapFavorites.length > 0 ? groupOverlapFavorites.map(([categoryId, count]) => (
                <span key={`view-overlap-${categoryId}`} className="pk-chip pk-chip-standard pk-chip-primary">
                  {toFavoriteLabel(categoryId)} ({count})
                </span>
              )) : <p className="text-[12px] italic text-[#6c889b]">No shared favorites yet.</p>}
            </div>
          </div>
          <div className="rounded-[14px] bg-[#d4e5ec] p-3">
            <p className="text-[14px] font-semibold text-[#485864]">Shared Habitats</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sharedHabitatCounts.length > 0 ? sharedHabitatCounts.map(([habitatId, count]) => (
                <span key={`view-habitat-${habitatId}`} className="pk-chip pk-chip-standard pk-chip-primary">
                  {toHabitatLabel(habitatId, entities.habitatsById)} ({count})
                </span>
              )) : <p className="text-[12px] italic text-[#6c889b]">No shared habitats yet.</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
          <h3 className="text-[18px] font-extrabold text-[#485864]">Pokemon ({selectedPokemon.length})</h3>
          <div className="mt-3 space-y-2">
            {selectedPokemon.map((pokemon) => (
              <article key={pokemon.id} className="flex items-center gap-3 rounded-[14px] bg-[#d4e5ec] p-2.5">
                <span className="inline-flex items-center justify-center rounded-[14px] bg-[#fff1e3] p-2">
                  {pokemon.imageUrl ? <img src={pokemon.imageUrl} alt={pokemon.name} className="h-10 w-10 object-contain" /> : null}
                </span>
                <div>
                  <p className="text-[18px] font-semibold text-[#485864]">{pokemon.name}</p>
                  <p className="text-[12px] text-[#6c889b]">{toHabitatLabel(pokemon.idealHabitatId, entities.habitatsById)}</p>
                </div>
              </article>
            ))}
            {selectedPokemon.length === 0 ? <p className="text-[12px] italic text-[#8e9aa3]">No Pokemon selected.</p> : null}
          </div>
        </section>

        <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
          <h3 className="text-[18px] font-extrabold text-[#485864]">Items ({buildItems.reduce((sum, item) => sum + item.quantityInBuild, 0)})</h3>
          <p className="mt-1 text-[12px] text-[#6c889b]">Tap an item to highlight required materials.</p>
          <div className="mt-3 space-y-2">
            {buildItems.map((entry) => {
              const isActive = activeItemId === entry.itemId;
              const dimBecauseMaterialSelection = activeMaterialId !== null && !activeMaterialItemIdSet.has(entry.itemId);
              return (
                <button
                  type="button"
                  key={entry.itemId}
                  onClick={() => setActiveItemId((prev) => (prev === entry.itemId ? null : entry.itemId))}
                  className={`w-full rounded-[14px] p-2.5 text-left ${
                    isActive ? "border border-[#65AADA] bg-[#e6f2fa]" : "bg-[#d4e5ec]"
                  } ${dimBecauseMaterialSelection ? "opacity-45" : "opacity-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center rounded-[14px] bg-[#fff1e3] p-2">
                      {entry.item.image ? <img src={entry.item.image} alt={entry.itemName} className="h-10 w-10 object-contain" /> : null}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold text-[#485864]">{entry.itemName}</p>
                      <p className="text-[12px] text-[#6c889b]">Qty: {entry.quantityInBuild}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            {buildItems.length === 0 ? <p className="text-[12px] italic text-[#8e9aa3]">No items added.</p> : null}
          </div>
        </section>

        <section className="rounded-[20px] border border-[#d9e2e5] bg-white p-4">
          <h3 className="text-[18px] font-extrabold text-[#485864]">Materials ({progressSummary.totalMaterials})</h3>
          <p className="mt-1 text-[12px] text-[#6c889b]">Tap a material to highlight items that consume it.</p>
          <div className="mt-3 space-y-2">
            {materialEntries.map((entry) => {
              const isActive = activeMaterialId === entry.materialId;
              const dimBecauseItemSelection = activeItemId !== null && !activeItemMaterialIdSet.has(entry.materialId);
              return (
                <article key={entry.materialId} className={`rounded-[14px] p-2.5 ${isActive ? "border border-[#65AADA] bg-[#e6f2fa]" : "bg-[#d4e5ec]"} ${dimBecauseItemSelection ? "opacity-45" : "opacity-100"}`}>
                  <button
                    type="button"
                    onClick={() => setActiveMaterialId((prev) => (prev === entry.materialId ? null : entry.materialId))}
                    className="w-full text-left"
                  >
                    <p className="text-[14px] font-semibold text-[#485864]">{entry.materialName}</p>
                  </button>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "home/material-progress/increment", materialId: entry.materialId, delta: -1 })}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#b3c9d2] bg-white text-[#6c889b]"
                      aria-label={`Decrease ${entry.materialName}`}
                    >
                      −
                    </button>
                    <p className="text-[12px] text-[#6c889b]">
                      {entry.ownedQuantity} / {entry.totalNeeded}
                    </p>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "home/material-progress/increment", materialId: entry.materialId, delta: 1 })}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#b3c9d2] bg-white text-[#6c889b]"
                      aria-label={`Increase ${entry.materialName}`}
                    >
                      +
                    </button>
                  </div>
                </article>
              );
            })}
            {materialEntries.length === 0 ? <p className="text-[12px] italic text-[#8e9aa3]">No materials required yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
};

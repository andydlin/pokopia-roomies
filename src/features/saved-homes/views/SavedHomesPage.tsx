import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBuildComparisonStats, getBuildMaterialAggregation } from "../../../domain/home-builder/materialPlanning";
import { normalizeSavedHome } from "../../../domain/home-builder/logic";
import type { CurrentHomeState, SavedHome } from "../../../domain/home-builder/models";
import { selectSavedHomes } from "../../../domain/home-builder/selectors";
import { EmptyState } from "../../../components/common/EmptyState";
import { useHomeBuilder } from "../../home-builder/state/HomeBuilderContext";

const toComparisonHome = (savedHome: SavedHome): CurrentHomeState => ({
  id: savedHome.id,
  name: savedHome.name,
  pokemonIds: [...savedHome.pokemonIds],
  itemIds: [...savedHome.itemIds],
  itemQuantities: { ...savedHome.itemQuantities },
  materialProgress: { ...savedHome.materialProgress },
  habitatId: savedHome.habitatId,
  isDirty: false,
  lastSavedAt: savedHome.updatedAt,
});

export const SavedHomesPage = () => {
  const { state, entities, loadSavedHome, deleteSavedHome, duplicateSavedHome, renameSavedHome } = useHomeBuilder();
  const navigate = useNavigate();
  const savedHomes = selectSavedHomes(state.savedHomes);
  const [compareSelection, setCompareSelection] = useState<Record<string, boolean>>({});

  const normalizedHomes = useMemo(
    () => savedHomes.map((home) => normalizeSavedHome(home)),
    [savedHomes],
  );
  const selectedCompareHomes = useMemo(
    () => normalizedHomes.filter((home) => compareSelection[home.id]),
    [normalizedHomes, compareSelection],
  );
  const comparisonStats = useMemo(
    () => selectedCompareHomes.map((home) => getBuildComparisonStats(home, entities)),
    [selectedCompareHomes, entities],
  );

  const sharedMaterials = useMemo(() => {
    if (selectedCompareHomes.length < 2) return [];
    const materialNameByBuild = selectedCompareHomes.map((home) => {
      const aggregates = getBuildMaterialAggregation(toComparisonHome(home), entities);
      return new Set(aggregates.map((entry) => entry.materialName));
    });
    const [first, ...rest] = materialNameByBuild;
    const intersection = [...first].filter((materialName) =>
      rest.every((materialSet) => materialSet.has(materialName)),
    );
    return intersection.sort((left, right) => left.localeCompare(right));
  }, [selectedCompareHomes, entities]);

  const cheapestBuild = useMemo(() => {
    if (comparisonStats.length < 2) return null;
    return [...comparisonStats].sort(
      (left, right) =>
        left.totalMaterialPieces - right.totalMaterialPieces || left.uniqueMaterialsCount - right.uniqueMaterialsCount,
    )[0];
  }, [comparisonStats]);

  return (
    <div className="space-y-6">
      {/* Section: Header */}
      <section>
        <p className="type-overline text-moss/60">Saved Homes</p>
        <h2 className="type-h2 mt-1 text-ink">Manage your homes</h2>
        <p className="type-body mt-2 text-ink/68">
          Open, duplicate, rename, compare, and track build-planning progress without leaving the workflow.
        </p>
      </section>

      {savedHomes.length === 0 ? (
        <EmptyState
          title="No saved homes yet"
          body="Use Save As New from the builder to keep multiple directions around."
          action={<Link to="/builder" className="type-ui rounded-full bg-moss px-4 py-2 text-paper">Open Home Builder</Link>}
        />
      ) : (
        <>
          {/* Section: Saved homes cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            {normalizedHomes.map((home) => {
              const stats = getBuildComparisonStats(home, entities);
              const isSelectedForCompare = Boolean(compareSelection[home.id]);
              return (
                <article key={home.id} className="rounded-3xl border border-white/70 bg-white/85 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <input
                      value={home.name}
                      onChange={(event) => renameSavedHome(home.id, event.target.value)}
                      className="type-h3 w-full rounded-xl border border-ink/10 bg-white px-3 py-2"
                    />
                    <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[12px] text-ink/75">
                      <input
                        type="checkbox"
                        checked={isSelectedForCompare}
                        onChange={() =>
                          setCompareSelection((previous) => ({ ...previous, [home.id]: !previous[home.id] }))
                        }
                      />
                      Compare
                    </label>
                  </div>
                  <p className="type-caption mt-1 text-ink/65">
                    {home.pokemonIds.length} Pokemon, {stats.itemQuantityTotal} items, {home.habitatId ? "habitat selected" : "no habitat"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-ink/75">
                    <div className="rounded-lg border border-ink/10 bg-white px-2 py-1.5">Unique materials: {stats.uniqueMaterialsCount}</div>
                    <div className="rounded-lg border border-ink/10 bg-white px-2 py-1.5">Total pieces: {stats.totalMaterialPieces}</div>
                    <div className="rounded-lg border border-ink/10 bg-white px-2 py-1.5">Craftable: {stats.craftableItemsCount}</div>
                    <div className="rounded-lg border border-ink/10 bg-white px-2 py-1.5">Progress: {stats.completionPercentage}%</div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        loadSavedHome(home.id);
                        navigate("/builder");
                      }}
                      className="type-ui rounded-full bg-moss px-3 py-2 text-paper"
                    >
                      Open in Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateSavedHome(home.id)}
                      className="type-ui rounded-full border border-ink/10 bg-white px-3 py-2"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedHome(home.id)}
                      className="type-ui col-span-2 rounded-full border border-berry/20 bg-berry/10 px-3 py-2 text-berry"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Section: Multi-build comparison */}
          <section className="rounded-3xl border border-white/70 bg-white/85 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="type-overline text-moss/60">Compare Builds</p>
                <h3 className="type-h3 mt-1 text-ink">Material planning comparison</h3>
              </div>
              <p className="type-caption text-ink/65">{selectedCompareHomes.length} selected</p>
            </div>

            {selectedCompareHomes.length < 2 ? (
              <p className="type-body mt-3 text-ink/70">Select at least two homes to compare materials, craftability, and completion side-by-side.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-ink/10 text-ink/65">
                        <th className="px-2 py-2 font-medium">Build</th>
                        <th className="px-2 py-2 font-medium">Items</th>
                        <th className="px-2 py-2 font-medium">Unique Materials</th>
                        <th className="px-2 py-2 font-medium">Total Material Pieces</th>
                        <th className="px-2 py-2 font-medium">Craftable</th>
                        <th className="px-2 py-2 font-medium">Non-craftable</th>
                        <th className="px-2 py-2 font-medium">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonStats.map((stats) => (
                        <tr key={`compare-row-${stats.buildId}`} className="border-b border-ink/5 text-ink/85">
                          <td className="px-2 py-2 font-medium">{stats.buildName}</td>
                          <td className="px-2 py-2">{stats.itemQuantityTotal}</td>
                          <td className="px-2 py-2">{stats.uniqueMaterialsCount}</td>
                          <td className="px-2 py-2">{stats.totalMaterialPieces}</td>
                          <td className="px-2 py-2">{stats.craftableItemsCount}</td>
                          <td className="px-2 py-2">{stats.nonCraftableItemsCount}</td>
                          <td className="px-2 py-2">{stats.completionPercentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-xl border border-ink/10 bg-white p-3">
                    <p className="text-[13px] font-medium text-ink">Shared materials</p>
                    <p className="mt-1 text-[12px] text-ink/75">
                      {sharedMaterials.length > 0 ? sharedMaterials.join(", ") : "No shared materials across all selected builds."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink/10 bg-white p-3">
                    <p className="text-[13px] font-medium text-ink">Most material-efficient</p>
                    <p className="mt-1 text-[12px] text-ink/75">
                      {cheapestBuild
                        ? `${cheapestBuild.buildName} (${cheapestBuild.totalMaterialPieces} total pieces, ${cheapestBuild.uniqueMaterialsCount} unique materials)`
                        : "Select more builds to compare efficiency."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

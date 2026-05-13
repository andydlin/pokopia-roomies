import { supabase } from "../supabase/client";
import { localSessionAdapter } from "./localSessionAdapter";
import type { Json } from "../supabase/database.types";
import type { PersistedSessionPayload, SavedHome } from "../../domain/home-builder/models";

type BuildRow = {
  id: string;
  owner_id: string;
  name: string;
  pokemon_ids: string[];
  item_ids: string[];
  item_quantities: Json;
  material_progress: Json;
  habitat_id: string | null;
  created_at: string;
  updated_at: string;
};

function rowToSavedHome(row: BuildRow): SavedHome {
  return {
    id: row.id,
    name: row.name,
    pokemonIds: row.pokemon_ids,
    itemIds: row.item_ids,
    itemQuantities: (row.item_quantities ?? {}) as Record<string, number>,
    materialProgress: (row.material_progress ?? {}) as Record<string, { ownedQuantity: number }>,
    habitatId: row.habitat_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function savedHomeToInsert(userId: string, home: SavedHome) {
  return {
    id: home.id,
    owner_id: userId,
    name: home.name,
    pokemon_ids: home.pokemonIds,
    item_ids: home.itemIds,
    item_quantities: home.itemQuantities as Json,
    material_progress: home.materialProgress as Json,
    habitat_id: home.habitatId ?? null,
  };
}

export const supabaseBuildsAdapter = {
  // Load all saved builds for a user from Supabase.
  // currentHome draft comes from localStorage (crash-recovery draft).
  async load(userId: string): Promise<PersistedSessionPayload> {
    const [{ data, error }, localPayload] = await Promise.all([
      supabase
        .from("builds")
        .select("*")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false }),
      Promise.resolve(localSessionAdapter.load()),
    ]);

    if (error) throw new Error(error.message);

    return {
      version: 1,
      currentHome: localPayload?.currentHome ?? null,
      savedHomes: (data ?? []).map(rowToSavedHome),
      exportedAt: Date.now(),
    };
  },

  async saveBuild(userId: string, home: SavedHome): Promise<void> {
    const { error } = await supabase
      .from("builds")
      .upsert(savedHomeToInsert(userId, home), { onConflict: "id" });
    if (error) throw new Error(error.message);
  },

  async deleteBuild(userId: string, homeId: string): Promise<void> {
    const { error } = await supabase
      .from("builds")
      .delete()
      .eq("id", homeId)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
  },
};

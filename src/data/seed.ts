import seedDataset from "../../chatgpt/pokopia_lab_codex_pack_v3/06_seed_dataset.json";
import type {
  FavoriteCategory,
  HabitatTrait,
  Item,
  Location,
  Pokemon,
  Specialty,
} from "../lib/types";

const spritePathForDex = (dexNumber?: number | null) =>
  dexNumber ? `/assets/pokopia-pokemon/${String(dexNumber).padStart(3, "0")}.png` : undefined;

export const habitatTraits = seedDataset.habitatTraits as HabitatTrait[];
export const favoriteCategories = seedDataset.favoriteCategories as unknown as FavoriteCategory[];
export const specialties = seedDataset.specialties as unknown as Specialty[];
export const locations = seedDataset.locations as unknown as Location[];
export const items = seedDataset.items as unknown as Item[];
export const pokemon = (seedDataset.pokemon as unknown as Pokemon[]).map((entry) => ({
  ...entry,
  imageUrl: spritePathForDex(entry.dexNumber) ?? entry.imageUrl,
}));

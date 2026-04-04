import seedDataset from "../../chatgpt/pokopia_lab_codex_pack_v3/06_seed_dataset.json";
import type {
  FavoriteCategory,
  HabitatTrait,
  Item,
  Location,
  Pokemon,
  Specialty,
} from "../lib/types";

const spritePathForDex = (dexNumber?: number) =>
  dexNumber ? `/assets/pokopia-pokemon/${String(dexNumber).padStart(3, "0")}.png` : undefined;

export const habitatTraits = seedDataset.habitatTraits as HabitatTrait[];
export const favoriteCategories = seedDataset.favoriteCategories as FavoriteCategory[];
export const specialties = seedDataset.specialties as Specialty[];
export const locations = seedDataset.locations as Location[];
export const items = seedDataset.items as Item[];
export const pokemon = (seedDataset.pokemon as Pokemon[]).map((entry) => ({
  ...entry,
  imageUrl: spritePathForDex(entry.dexNumber) ?? entry.imageUrl,
}));

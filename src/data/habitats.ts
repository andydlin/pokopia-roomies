import { generatedHabitats } from "./generated/habitats";
import type { Habitat } from "../lib/types";

export const habitats: Habitat[] = generatedHabitats.map((habitat) => ({
  id: habitat.id,
  number: habitat.number,
  name: habitat.name,
  slug: habitat.slug,
  description: habitat.description,
  imageUrl: habitat.imageUrl,
  sourceUrl: habitat.sourceUrl,
}));

export const habitatById = new Map(habitats.map((habitat) => [habitat.id, habitat]));
export const habitatBySlug = new Map(habitats.map((habitat) => [habitat.slug, habitat]));

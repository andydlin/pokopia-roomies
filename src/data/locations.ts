import { generatedPokemon } from "./generated/pokemon";
import type { Location } from "../lib/types";

const titleCase = (value: string) =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const locations: Location[] = [...new Set(generatedPokemon.flatMap((entry) => entry.locations))]
  .sort((left, right) => left.localeCompare(right))
  .map((locationId) => ({
    id: locationId,
    name: titleCase(locationId),
    slug: locationId,
  }));
export const locationById = new Map(locations.map((location) => [location.id, location]));

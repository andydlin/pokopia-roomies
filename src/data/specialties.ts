import { generatedPokemon } from "./generated/pokemon";
import type { Specialty } from "../lib/types";

const titleCase = (value: string) =>
  value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const specialties: Specialty[] = [...new Set(generatedPokemon.flatMap((entry) => entry.specialties))]
  .sort((left, right) => left.localeCompare(right))
  .map((specialtyId) => ({
    id: specialtyId,
    name: titleCase(specialtyId),
    slug: specialtyId,
  }));
export const specialtyById = new Map(specialties.map((specialty) => [specialty.id, specialty]));

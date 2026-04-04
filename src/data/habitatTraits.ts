import { habitatTraits as seedHabitatTraits } from "./seed";

export const habitatTraits = seedHabitatTraits;
export const habitatTraitById = new Map(habitatTraits.map((trait) => [trait.id, trait]));

import type {
  FavoriteCategory,
  Habitat,
  HabitatTrait,
  Item,
  Location,
  Pokemon,
  Specialty,
} from "../types";

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const assertArray = (value: unknown, fieldName: string, pokemonId: string) => {
  if (!Array.isArray(value)) {
    throw new Error(`Pokemon ${pokemonId} is missing required array field "${fieldName}".`);
  }
};

const assertReferencesExist = (
  values: string[],
  validIds: Set<string>,
  fieldName: string,
  pokemonId: string,
) => {
  values.forEach((value) => {
    if (!validIds.has(value)) {
      throw new Error(`Pokemon ${pokemonId} references unknown ${fieldName} id "${value}".`);
    }
  });
};

export const validatePokemonCollection = ({
  pokemon,
  habitatTraits,
  habitats,
  locations,
  specialties,
  favoriteCategories,
  items,
}: {
  pokemon: Pokemon[];
  habitatTraits: HabitatTrait[];
  habitats: Habitat[];
  locations: Location[];
  specialties: Specialty[];
  favoriteCategories: FavoriteCategory[];
  items: Item[];
}) => {
  const pokemonIds = new Set(pokemon.map((entry) => entry.id));
  if (pokemonIds.size !== pokemon.length) {
    throw new Error("Duplicate Pokemon ids detected in canonical data.");
  }

  const habitatTraitIds = new Set(habitatTraits.map((entry) => entry.id));
  const habitatIds = new Set(habitats.map((entry) => entry.id));
  const locationIds = new Set(locations.map((entry) => entry.id));
  const specialtyIds = new Set(specialties.map((entry) => entry.id));
  const favoriteCategoryIds = new Set(favoriteCategories.map((entry) => entry.id));
  const itemIds = new Set(items.map((entry) => entry.id));

  pokemon.forEach((entry) => {
    if (!isNonEmptyString(entry.id) || !isNonEmptyString(entry.slug) || !isNonEmptyString(entry.name)) {
      throw new Error(`Pokemon record is missing required identity fields: ${JSON.stringify(entry)}`);
    }

    assertArray(entry.specialtyIds, "specialtyIds", entry.id);
    assertArray(entry.favoriteCategoryIds, "favoriteCategoryIds", entry.id);
    assertArray(entry.idealHabitatTraitIds, "idealHabitatTraitIds", entry.id);
    assertArray(entry.habitatIds, "habitatIds", entry.id);
    assertArray(entry.locationIds, "locationIds", entry.id);

    assertReferencesExist(entry.specialtyIds, specialtyIds, "specialty", entry.id);
    assertReferencesExist(entry.favoriteCategoryIds, favoriteCategoryIds, "favorite category", entry.id);
    assertReferencesExist(entry.idealHabitatTraitIds, habitatTraitIds, "ideal habitat trait", entry.id);
    assertReferencesExist(entry.habitatIds, habitatIds, "habitat", entry.id);
    assertReferencesExist(entry.locationIds, locationIds, "location", entry.id);
  });

  habitats.forEach((habitat) => {
    if (!Array.isArray(habitat.traitIds)) {
      throw new Error(`Habitat ${habitat.id} is missing traitIds.`);
    }
    habitat.traitIds.forEach((traitId) => {
      if (!habitatTraitIds.has(traitId)) {
        throw new Error(`Habitat ${habitat.id} references unknown habitat trait "${traitId}".`);
      }
    });
  });

  favoriteCategories.forEach((category) => {
    category.itemIds.forEach((itemId) => {
      if (!itemIds.has(itemId)) {
        throw new Error(`Favorite category ${category.id} references unknown item "${itemId}".`);
      }
    });
  });

  items.forEach((item) => {
    item.habitatTraitIds.forEach((traitId) => {
      if (!habitatTraitIds.has(traitId)) {
        throw new Error(`Item ${item.id} references unknown habitat trait "${traitId}".`);
      }
    });

    item.favoriteCategoryIds.forEach((categoryId) => {
      if (!favoriteCategoryIds.has(categoryId)) {
        throw new Error(`Item ${item.id} references unknown favorite category "${categoryId}".`);
      }
    });

    item.benefitingPokemonIds.forEach((pokemonId) => {
      if (!pokemonIds.has(pokemonId)) {
        throw new Error(`Item ${item.id} references unknown Pokemon "${pokemonId}".`);
      }
    });
  });
};

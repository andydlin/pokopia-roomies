import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseAvailablePokemonPage,
  normalizeHabitatId,
  normalizeTimeId,
  normalizeWeatherId,
  parseFavoriteCategoryPage,
  parseFavoritesIndexPage,
  parseItemsPage,
  parseHabitatsPage,
  parseHabitatRequirements,
  parseFlavorPageSection,
  parseItemDetail,
  parsePokemonDetail,
  renderTsModule,
  slugify,
} from "./pokopia-graph-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(projectRoot, "src/data/generated");
const typeOverridesBySourceSlug = new Map([
  ["paldeanwooper", ["poison", "ground"]],
]);

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "pokopia-roomies-graph/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const FAVORITE_FLAVOR_CATEGORY_PATTERN = /_flavor$/;

const validateGeneratedItemFavoriteMappings = (items, favoriteItems) => {
  if (favoriteItems.length === 0) {
    throw new Error("Generated favoriteItems payload is empty.");
  }

  const favoriteItemById = new Map(favoriteItems.map((item) => [item.id, item]));
  const categoryById = new Map();
  items.forEach((item) => {
    item.favoriteCategoryIds.forEach((categoryId) => {
      if (!categoryById.has(categoryId)) categoryById.set(categoryId, []);
      categoryById.get(categoryId).push(item.id);
    });
  });

  if (!categoryById.has("group_activities")) {
    throw new Error("No generated item maps to group_activities.");
  }
  if (!categoryById.has("cute_stuff")) {
    throw new Error("No generated item maps to cute_stuff.");
  }
  if (![...categoryById.keys()].some((categoryId) => FAVORITE_FLAVOR_CATEGORY_PATTERN.test(categoryId))) {
    throw new Error("No generated item maps to a flavor favorite category.");
  }

  if (!items.some((item) => item.favoriteCategoryIds.length === 0)) {
    throw new Error("Expected at least one item with empty favoriteCategoryIds.");
  }

  items.forEach((item) => {
    const favoriteItem = favoriteItemById.get(item.id);
    if (!favoriteItem) {
      throw new Error(`Missing favorite item record for ${item.id}.`);
    }
    const left = [...new Set(item.favoriteCategoryIds)].sort();
    const right = [...new Set(favoriteItem.favoriteCategoryIds)].sort();
    if (left.length !== right.length || left.some((categoryId, index) => categoryId !== right[index])) {
      throw new Error(`favoriteCategoryIds mismatch between items/favoriteItems for ${item.id}.`);
    }
  });
};

const buildPokemon = async (seed) => {
  const url = `https://www.serebii.net/pokemonpokopia/pokedex/${seed.sourceSlug}.shtml`;
  const html = await fetchText(url);
  const parsed = parsePokemonDetail(html, seed);

  return {
    id: seed.id,
    name: seed.name,
    dexNumber: seed.dexNumber,
    imageUrl: `/assets/pokopia-pokemon/${seed.spriteAssetId}.png`,
    idealHabitat: normalizeHabitatId(parsed.idealHabitatLabel ?? seed.fallback.habitats[0] ?? "bright"),
    habitats: [...new Set((parsed.habitatLabels.length > 0 ? parsed.habitatLabels : seed.fallback.habitats).map(normalizeHabitatId))],
    favorites: [...new Set(parsed.favorites.map((favorite) =>
      favorite.sourceType === "flavor"
        ? slugify(`${favorite.label.replace(/\s+flavors?$/i, "")}_flavor`)
        : slugify(favorite.label),
    ))],
    specialties: [...new Set((parsed.specialtyLabels.length > 0 ? parsed.specialtyLabels : seed.fallback.specialties ?? []).map(slugify))],
    locations: [...new Set((parsed.locationLabels.length > 0 ? parsed.locationLabels : seed.fallback.locations).map(slugify))],
    timeOfDay: [...new Set((parsed.timeLabels.length > 0 ? parsed.timeLabels : seed.fallback.timeOfDay ?? []).map(normalizeTimeId))],
    weather: [...new Set((parsed.weatherLabels.length > 0 ? parsed.weatherLabels : seed.fallback.weather ?? []).map(normalizeWeatherId))],
    types: (() => {
      const parsedTypeIds = [...new Set(parsed.typeLabels.map(slugify))];
      if (parsedTypeIds.length > 0) return parsedTypeIds;
      return typeOverridesBySourceSlug.get(seed.sourceSlug) ?? [];
    })(),
    sourceSlug: seed.sourceSlug,
    sourceLabels: {
      idealHabitat: parsed.idealHabitatLabel ?? seed.fallback.habitats[0],
      favorites: parsed.favorites.map((favorite) => favorite.label),
      specialties: parsed.specialtyLabels,
      types: parsed.typeLabels,
    },
    sourceNotes: "Generated from Serebii Pokemon detail pages with fallback context from local seed data.",
    favoriteSources: parsed.favorites,
  };
};

const main = async () => {
  await mkdir(generatedDir, { recursive: true });

  const availablePokemonHtml = await fetchText(
    "https://www.serebii.net/pokemonpokopia/availablepokemon.shtml",
  );
  const favoritesIndexHtml = await fetchText(
    "https://www.serebii.net/pokemonpokopia/favorites.shtml",
  );
  const itemsHtml = await fetchText("https://www.serebii.net/pokemonpokopia/items.shtml");
  const habitatsHtml = await fetchText(
    "https://www.serebii.net/pokemonpokopia/habitats.shtml",
  );
  const allItems = parseItemsPage(itemsHtml);
  const allItemsById = new Map(allItems.map((item) => [item.id, item]));
  const pokemonSeed = parseAvailablePokemonPage(availablePokemonHtml);
  const canonicalFavoriteSlugs = new Map(
    parseFavoritesIndexPage(favoritesIndexHtml).map((favorite) => [favorite.label.toLowerCase(), favorite.sourceSlug]),
  );
  const habitats = parseHabitatsPage(habitatsHtml);
  for (const habitat of habitats) {
    const detailHtml = await fetchText(habitat.sourceUrl);
    habitat.requiredItems = parseHabitatRequirements(detailHtml);
  }

  const pokemonWithSources = [];
  for (const seed of pokemonSeed) {
    const pokemon = await buildPokemon(seed);
    pokemon.favoriteSources = pokemon.favoriteSources
      .map((favorite) =>
        favorite.sourceType === "favorite"
          ? {
              ...favorite,
              sourceSlug: canonicalFavoriteSlugs.get(favorite.label.toLowerCase()) ?? favorite.sourceSlug,
            }
          : favorite,
      )
      .filter((favorite) => favorite.sourceType !== "favorite" || canonicalFavoriteSlugs.has(favorite.label.toLowerCase()));
    pokemonWithSources.push(pokemon);
  }

  const favoriteSourceMap = new Map();
  pokemonWithSources.forEach((pokemon) => {
    pokemon.favoriteSources.forEach((favorite) => {
      const key = `${favorite.sourceType}:${favorite.sourceSlug}`;
      if (!favoriteSourceMap.has(key)) {
        favoriteSourceMap.set(key, favorite);
      }
    });
  });

  const categories = [];
  const itemSeedMap = new Map();
  const flavorHtml = favoriteSourceMap.size
    ? await fetchText("https://www.serebii.net/pokemonpokopia/flavors.shtml")
    : "";

  for (const favorite of favoriteSourceMap.values()) {
    if (favorite.sourceType === "favorite") {
      const html = await fetchText(
        `https://www.serebii.net/pokemonpokopia/favorites/${favorite.sourceSlug}.shtml`,
      );
      const parsed = parseFavoriteCategoryPage(html, favorite);
      categories.push(parsed);
      parsed.items.forEach((item) => {
        itemSeedMap.set(item.slug, item);
      });
    } else {
      const parsed = parseFlavorPageSection(flavorHtml, favorite);
      categories.push(parsed);
      parsed.items.forEach((item) => {
        itemSeedMap.set(item.slug, item);
      });
    }
  }

  const itemRecords = [];
  for (const itemSeed of allItems) {
    const html = await fetchText(`https://www.serebii.net/pokemonpokopia/items/${itemSeed.sourceSlug}.shtml`);
    itemRecords.push(parseItemDetail(html, itemSeed.sourceSlug, itemSeed.name));
  }

  const itemDetailById = new Map(itemRecords.map((item) => [item.id, item]));

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const itemById = new Map(
    allItems.map((item) => {
      const detail = itemDetailById.get(item.id);
      return [
        item.id,
        {
          ...item,
          sourceSlug: item.sourceSlug,
          imageUrl: item.imageUrl,
          itemCategory: slugify(item.itemCategoryLabel || detail?.itemCategoryLabel || "unknown"),
          itemCategoryLabel: item.itemCategoryLabel || detail?.itemCategoryLabel || "Unknown",
          favoriteCategoryIds: [],
          benefitingPokemonIds: [],
          recipeMaterials: detail?.recipeMaterials ?? [],
          recipeLocation: detail?.recipeLocation ?? null,
          obtainabilityDetails: detail?.obtainabilityDetails ?? [],
          sourceLabels: {
            category: item.itemCategoryLabel || detail?.itemCategoryLabel || "Unknown",
            favoriteCategories: detail?.favoriteCategories.map((favorite) => favorite.label) ?? [],
          },
        },
      ];
    }),
  );

  categories.forEach((category) => {
    category.itemIds = [];
    category.items.forEach((item) => {
      const itemRecord = itemById.get(item.slug);
      if (!itemRecord) return;
      if (!itemRecord.favoriteCategoryIds.includes(category.id)) {
        itemRecord.favoriteCategoryIds.push(category.id);
      }
      category.itemIds.push(itemRecord.id);
    });
    delete category.items;
  });

  itemRecords.forEach((item) => {
    const itemRecord = itemById.get(item.id);
    if (!itemRecord) return;
    item.favoriteCategories.forEach((favorite) => {
      const categoryId =
        favorite.sourceType === "flavor"
          ? slugify(`${favorite.label.replace(/\s+flavors?$/i, "")}_flavor`)
          : slugify(favorite.label);
      if (categoryById.has(categoryId) && !itemRecord.favoriteCategoryIds.includes(categoryId)) {
        itemRecord.favoriteCategoryIds.push(categoryId);
        categoryById.get(categoryId).itemIds.push(itemRecord.id);
      }
    });
  });

  const pokemonRecords = pokemonWithSources.map((pokemon) => {
    const cleanPokemon = { ...pokemon };
    delete cleanPokemon.favoriteSources;
    return cleanPokemon;
  });

  const pokemonByFavoriteCategory = new Map();
  pokemonRecords.forEach((pokemon) => {
    pokemon.favorites.forEach((categoryId) => {
      if (!pokemonByFavoriteCategory.has(categoryId)) {
        pokemonByFavoriteCategory.set(categoryId, []);
      }
      pokemonByFavoriteCategory.get(categoryId).push(pokemon.id);
    });
  });

  itemById.forEach((item) => {
    const benefitingPokemonIds = new Set();
    item.favoriteCategoryIds.forEach((categoryId) => {
      (pokemonByFavoriteCategory.get(categoryId) ?? []).forEach((pokemonId) =>
        benefitingPokemonIds.add(pokemonId),
      );
    });
    item.benefitingPokemonIds = [...benefitingPokemonIds].sort();
  });

  await writeFile(
    path.join(generatedDir, "pokemon.ts"),
    renderTsModule("generatedPokemon", pokemonRecords),
  );
  await writeFile(
    path.join(generatedDir, "favoriteCategories.ts"),
    renderTsModule(
      "generatedFavoriteCategories",
      [...categoryById.values()]
        .map((category) => ({
          ...category,
          itemIds: [...new Set(category.itemIds)].sort(),
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    ),
  );
  const generatedItems = [...itemById.values()]
    .map((item) => ({
      id: item.id,
      sourceSlug: item.sourceSlug,
      name: item.name,
      imageUrl: item.imageUrl,
      itemCategory: item.itemCategory,
      itemCategoryLabel: item.itemCategoryLabel,
      sourceSectionAnchor: item.sourceSectionAnchor ?? item.itemCategory,
      comfortCategoryIds: [...new Set(item.comfortCategoryIds ?? [])].sort(),
      comfortCategoryLabels: [...new Set(item.comfortCategoryLabels ?? [])],
      favoriteCategoryIds: [...new Set(item.favoriteCategoryIds ?? [])].sort(),
      benefitingPokemonIds: [...new Set(item.benefitingPokemonIds ?? [])].sort(),
      recipeMaterials: [...(item.recipeMaterials ?? [])],
      recipeLocation: item.recipeLocation ?? null,
      obtainabilityDetails: [...(item.obtainabilityDetails ?? [])],
      sourceLabels: {
        category: item.sourceLabels?.category ?? item.itemCategoryLabel ?? "Unknown",
        favoriteCategories: [...new Set(item.sourceLabels?.favoriteCategories ?? [])],
      },
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const generatedFavoriteItems = [...itemById.values()]
    .map((item) => ({
      ...item,
      comfortCategoryIds: [...new Set(item.comfortCategoryIds ?? [])].sort(),
      comfortCategoryLabels: [...new Set(item.comfortCategoryLabels ?? [])],
      favoriteCategoryIds: [...new Set(item.favoriteCategoryIds ?? [])].sort(),
      benefitingPokemonIds: [...new Set(item.benefitingPokemonIds ?? [])].sort(),
      recipeMaterials: [...(item.recipeMaterials ?? [])],
      obtainabilityDetails: [...(item.obtainabilityDetails ?? [])],
      sourceLabels: {
        category: item.sourceLabels?.category ?? item.itemCategoryLabel ?? "Unknown",
        favoriteCategories: [...new Set(item.sourceLabels?.favoriteCategories ?? [])],
      },
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  validateGeneratedItemFavoriteMappings(generatedItems, generatedFavoriteItems);

  await writeFile(
    path.join(generatedDir, "items.ts"),
    renderTsModule("generatedItems", generatedItems),
  );
  await writeFile(
    path.join(generatedDir, "favoriteItems.ts"),
    renderTsModule("generatedFavoriteItems", generatedFavoriteItems),
  );
  await writeFile(
    path.join(generatedDir, "habitats.ts"),
    renderTsModule(
      "generatedHabitats",
      habitats.sort((left, right) => left.number - right.number || left.name.localeCompare(right.name)),
    ),
  );

  console.log(
    `Generated graph for ${pokemonRecords.length} Pokemon, ${categoryById.size} categories, ${itemById.size} items, and ${habitats.length} habitats.`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

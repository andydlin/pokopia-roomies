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
  parseHabitatsPage,
  parseFlavorPageSection,
  parseItemDetail,
  parsePokemonDetail,
  renderTsModule,
  slugify,
} from "./pokopia-graph-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const generatedDir = path.join(projectRoot, "src/data/generated");

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "pokopia-roomies-graph/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
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
    sourceSlug: seed.sourceSlug,
    sourceLabels: {
      idealHabitat: parsed.idealHabitatLabel ?? seed.fallback.habitats[0],
      favorites: parsed.favorites.map((favorite) => favorite.label),
      specialties: parsed.specialtyLabels,
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
  const habitatsHtml = await fetchText(
    "https://www.serebii.net/pokemonpokopia/habitats.shtml",
  );
  const pokemonSeed = parseAvailablePokemonPage(availablePokemonHtml);
  const canonicalFavoriteSlugs = new Map(
    parseFavoritesIndexPage(favoritesIndexHtml).map((favorite) => [favorite.label.toLowerCase(), favorite.sourceSlug]),
  );
  const habitats = parseHabitatsPage(habitatsHtml);

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
  for (const [itemSlug, itemSeed] of itemSeedMap.entries()) {
    const html = await fetchText(`https://www.serebii.net/pokemonpokopia/items/${itemSlug}.shtml`);
    itemRecords.push(parseItemDetail(html, itemSlug, itemSeed.name));
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const itemById = new Map(
    itemRecords.map((item) => [
      item.id,
      {
        id: item.id,
        sourceSlug: item.sourceSlug,
        name: item.name,
        imageUrl: `/assets/pokopia-items/${item.sourceSlug}.png`,
        itemCategory: slugify(item.itemCategoryLabel),
        itemCategoryLabel: item.itemCategoryLabel,
        favoriteCategoryIds: [],
        benefitingPokemonIds: [],
        sourceLabels: {
          category: item.itemCategoryLabel,
          favoriteCategories: item.favoriteCategories.map((favorite) => favorite.label),
        },
      },
    ]),
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
  await writeFile(
    path.join(generatedDir, "favoriteItems.ts"),
    renderTsModule(
      "generatedFavoriteItems",
      [...itemById.values()]
        .map((item) => ({
          ...item,
          favoriteCategoryIds: [...new Set(item.favoriteCategoryIds)].sort(),
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    ),
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

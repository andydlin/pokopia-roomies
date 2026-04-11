const ROOT = "https://www.serebii.net";

export const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/pok[eé]/g, "poke")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

export const itemIdFromSlug = (slug) => slug.toLowerCase();

export const normalizeHabitatId = (label) => {
  const normalized = slugify(label);
  if (normalized === "openair") return "open_air";
  return normalized;
};

export const normalizeTimeId = (label) => {
  const normalized = slugify(label);
  if (normalized === "morning" || normalized === "evening") return "day";
  return normalized;
};

export const normalizeWeatherId = (label) => {
  const normalized = slugify(label);
  if (normalized === "sun" || normalized === "cloud") return "clear";
  return normalized;
};

const decode = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&eacute;/g, "e")
    .replace(/&nbsp;/g, " ")
    .replace(/&uuml;/g, "u")
    .replace(/&aacute;/g, "a")
    .replace(/&iacute;/g, "i")
    .replace(/&oacute;/g, "o")
    .replace(/&uacute;/g, "u")
    .replace(/&deg;/g, "°")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&hellip;/g, "...")
    .replace(/&egrave;/g, "e")
    .replace(/&Eacute;/g, "E")
    .replace(/&uuml;/g, "u")
    .replace(/&ouml;/g, "o")
    .replace(/&auml;/g, "a");

const strip = (value) => decode(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

export const parsePokemonDetail = (html, seed) => {
  const idealHabitatMatch = html.match(/idealhabitat\/[^"]+\.shtml"><u>([^<]+)<\/u>/i);
  const specialtyMatches = [...html.matchAll(/pokedex\/specialty\/[^"]+\.shtml"><u>([^<]+)<\/u>/gi)];
  const favoriteMatches = [
    ...html.matchAll(/href="\/pokemonpokopia\/(favorites\/[^"]+\.shtml|flavors\.shtml)"><u>([^<]+)<\/u>/gi),
  ];
  const habitatMatches = [...html.matchAll(/href="\/pokemonpokopia\/habitatdex\/[^"]+\.shtml"><u>([^<]+)<\/u>/gi)];
  const locationMatches = [...html.matchAll(/href="\/pokemonpokopia\/locations\/[^"]+\.shtml"><u>([^<]+)<\/u>/gi)];
  const typeMatches = [
    ...html.matchAll(/href="\/pokedex-[^/]+\/[^"]+\.shtml"><img[^>]+alt="([^"]+)"[^>]*>/gi),
  ];
  const timeWeatherBlock = html.match(
    /<b>Time<\/b><\/td><td width="50%" align="center"><b>Weather<\/b><\/td><\/tr>\s*<tr><td valign="top">\s*(.*?)<\/td><td valign="top">\s*(.*?)<\/tr><\/table>/is,
  );

  return {
    idealHabitatLabel: idealHabitatMatch ? strip(idealHabitatMatch[1]) : null,
    specialtyLabels: [...new Set(specialtyMatches.map((match) => strip(match[1])))],
    favorites: favoriteMatches
      .map((match) => ({
        sourcePath: match[1],
        label: strip(match[2]),
        sourceType: match[1].startsWith("favorites/") ? "favorite" : "flavor",
        sourceSlug: match[1].startsWith("favorites/")
          ? match[1].replace(/^favorites\//, "").replace(/\.shtml$/, "")
          : slugify(strip(match[2]).replace(/\s+flavors?$/i, "")),
      }))
      .filter((favorite) => favorite.sourceSlug !== "none" && favorite.label.toLowerCase() !== "none"),
    habitatLabels: [...new Set(habitatMatches.map((match) => strip(match[1])))],
    locationLabels: [...new Set(locationMatches.map((match) => strip(match[1])))],
    typeLabels: [...new Set(typeMatches.map((match) => strip(match[1])).filter(Boolean))],
    timeLabels: timeWeatherBlock
      ? strip(timeWeatherBlock[1])
          .split(" ")
          .filter(Boolean)
      : seed.fallback.timeOfDay ?? [],
    weatherLabels: timeWeatherBlock
      ? strip(timeWeatherBlock[2])
          .split(" ")
          .filter(Boolean)
      : seed.fallback.weather ?? [],
  };
};

export const parseAvailablePokemonPage = (html) => {
  const rowPattern =
    /<tr>\s*<td class="cen">#?([^<]+)<\/td>\s*<td class="cen"><a href="\/pokemonpokopia\/pokedex\/([^"]+)\.shtml"><img src="\/pokemonpokopia\/pokemon\/small\/([^"]+)\.png"[^>]*><\/a><\/td>\s*<td class="cen"><a href="\/pokemonpokopia\/pokedex\/[^"]+\.shtml"><u>([^<]+)<\/u><\/a><\/td>\s*<td class="cen">([\s\S]*?)<\/td>\s*<\/tr>/gi;

  const pokemon = [];
  for (const match of html.matchAll(rowPattern)) {
    const dexNumber = Number.parseInt(match[1].replace(/\D/g, ""), 10);
    const sourceSlug = match[2];
    const spriteAssetId = match[3];
    const name = strip(match[4]);
    const specialtyLabels = [
      ...new Set(
        [...match[5].matchAll(/pokedex\/specialty\/[^"]+\.shtml"><u>([^<]+)<\/u>/gi)].map((specialtyMatch) =>
          strip(specialtyMatch[1]),
        ),
      ),
    ];

    pokemon.push({
      id: sourceSlug,
      name,
      dexNumber: Number.isFinite(dexNumber) ? dexNumber : undefined,
      spriteAssetId,
      sourceSlug,
      fallback: {
        habitats: [],
        locations: [],
        timeOfDay: [],
        weather: [],
        specialties: specialtyLabels,
      },
    });
  }

  return pokemon;
};

export const parseFavoriteCategoryPage = (html, category) => {
  const titleMatch = html.match(/<h2><a name="items"><\/a>List of (.*?) Items/i);
  const descriptionMatch = html.match(/<p><i>(.*?)<\/i><\/p>/i);
  const itemMatches = [
    ...html.matchAll(
      /href="\/pokemonpokopia\/items\/([^"]+)\.shtml"><img[^>]+alt="([^"]+)"[^>]*><\/a><\/td>\s*<td class="cen"><a href="\/pokemonpokopia\/items\/[^"]+"><u>([^<]+)<\/u>/gi,
    ),
  ];

  return {
    id: slugify(category.label),
    name: category.label,
    sourceSlug: category.sourceSlug,
    sourceType: "favorite",
    description: descriptionMatch ? strip(descriptionMatch[1]) : titleMatch ? strip(titleMatch[1]) : undefined,
    items: [...new Map(itemMatches.map((match) => [match[1], { slug: match[1], name: strip(match[3]) }])).values()],
  };
};

export const parseFavoritesIndexPage = (html) =>
  [
    ...html.matchAll(/href="\/pokemonpokopia\/favorites\/([^"]+)\.shtml"><u>([^<]+)<\/u>/gi),
  ].map((match) => ({
    sourceSlug: match[1],
    label: strip(match[2]),
  }));

export const parseItemsPage = (html) => {
  const sectionPattern =
    /<p><h2><a name="([^"]+)"><\/a>List of ([^<]+)<\/h2><\/p>\s*<table class="dextable"[\s\S]*?>([\s\S]*?)<\/table>/gi;
  const rowPattern =
    /<tr><td class="cen"><a href="(?:\/pokemonpokopia\/)?items\/([^"]+)\.shtml"><img[\s\S]*?<\/tr>/gi;
  const namePattern =
    /<td class="cen"><a href="(?:\/pokemonpokopia\/)?items\/[^"]+\.shtml"><u>([^<]+)<\/u><\/a><\/td>/i;
  const tagPattern =
    /<a href="(?:\/pokemonpokopia\/)?items\/([^"]+)\.shtml">[\s\S]*?<br\s*\/?>\s*([^<]+)\s*<\/a>/gi;
  const explicitComfortTagIds = new Set(["decoration", "food", "relaxation", "road", "toy"]);

  const itemsById = new Map();

  for (const sectionMatch of html.matchAll(sectionPattern)) {
    const sectionAnchor = strip(sectionMatch[1]);
    const categoryLabel = strip(sectionMatch[2]);
    const sectionHtml = sectionMatch[3];
    const categoryId = slugify(categoryLabel);

    for (const rowMatch of sectionHtml.matchAll(rowPattern)) {
      const rowHtml = rowMatch[0];
      const sourceSlug = strip(rowMatch[1]);
      const itemId = itemIdFromSlug(sourceSlug);
      const nameMatch = rowHtml.match(namePattern);
      const name = nameMatch ? strip(nameMatch[1]) : sourceSlug;
      const infoCells = [...rowHtml.matchAll(/<td class="fooinfo">([\s\S]*?)<\/td>/gi)];
      const tagCell = infoCells[1]?.[1] ?? "";
      const comfortTags = [...tagCell.matchAll(tagPattern)].map((match) => ({
        id: slugify(strip(match[1])),
        label: strip(match[2]),
      }));
      const comfortCategoryIds = [...new Set(comfortTags.map((tag) => tag.id).filter((id) => explicitComfortTagIds.has(id)))];
      const comfortCategoryLabels = [...new Set(comfortTags.map((tag) => tag.label))];

      if (!itemsById.has(itemId)) {
        itemsById.set(itemId, {
          id: itemId,
          sourceSlug,
          name,
          imageUrl: `/assets/pokopia-items/${sourceSlug}.png`,
          itemCategory: categoryId,
          itemCategoryLabel: categoryLabel,
          sourceSectionAnchor: sectionAnchor,
          comfortCategoryIds,
          comfortCategoryLabels,
        });
      } else if (comfortCategoryIds.length > 0) {
        const existing = itemsById.get(itemId);
        existing.comfortCategoryIds = [...new Set([...(existing.comfortCategoryIds ?? []), ...comfortCategoryIds])];
        existing.comfortCategoryLabels = [...new Set([...(existing.comfortCategoryLabels ?? []), ...comfortCategoryLabels])];
      }
    }
  }

  return [...itemsById.values()].sort((left, right) => left.name.localeCompare(right.name));
};

export const parseHabitatsPage = (html) =>
  [
    ...html.matchAll(
      /<tr>\s*<td class="cen">#?([^<]+)<\/td>\s*<td class="cen"><a href="habitatdex\/([^"]+)\.shtml"><img src="habitatdex\/([^"]+)\.png"[^>]*><\/a><\/td>\s*<td class="fooinfo"><a href="habitatdex\/[^"]+\.shtml"><u>([^<]+)<\/u><\/a><\/td>\s*<td class="fooinfo">([\s\S]*?)<\/td>\s*<\/tr>/gi,
    ),
  ].map((match) => ({
    id: slugify(strip(match[4])),
    number: Number.parseInt(match[1].replace(/\D/g, ""), 10),
    name: strip(match[4]),
    slug: match[2],
    imageUrl: `/assets/pokopia-habitats/${match[3]}.png`,
    sourceUrl: toAbsolute(`pokemonpokopia/habitatdex/${match[2]}.shtml`),
    description: strip(match[5]),
  }));

export const parseHabitatRequirements = (html) => {
  const sectionMatch = html.match(
    /<p><h2>Requirements<\/h2><\/p>\s*<table class="dextable"[\s\S]*?<\/table>/i,
  );
  if (!sectionMatch) return [];

  const rowMatches = [
    ...sectionMatch[0].matchAll(
      /<tr><td class="cen">[\s\S]*?<\/td>\s*<td class="fooinfo">[\s\S]*?<u>([^<]+)<\/u>[\s\S]*?<\/td>\s*<td class="fooinfo">(\d+)<\/td>\s*<\/tr>/gi,
    ),
  ];

  return rowMatches.map((match) => ({
    itemId: slugify(strip(match[1])),
    itemName: strip(match[1]),
    quantity: Number.parseInt(match[2], 10),
  }));
};

export const parseFlavorPageSection = (html, category) => {
  const anchor = category.sourceSlug;
  const sectionPattern = new RegExp(
    `<a name="${anchor}"><\\/a><h3>.*?<\\/tr>([\\s\\S]*?)(?:<tr><td class="fooevo"|<\\/table>)`,
    "i",
  );
  const sectionMatch = html.match(sectionPattern);
  const section = sectionMatch ? sectionMatch[1] : "";
  const itemMatches = [
    ...section.matchAll(
      /<img src="items\/([^"]+)\.png"[^>]+alt="([^"]+)"[^>]*><\/td><td class="cen">([^<]+)<\/td>/gi,
    ),
  ];

  return {
    id: slugify(`${category.label.replace(/\s+flavors?$/i, "")}_flavor`),
    name: category.label,
    sourceSlug: anchor,
    sourceType: "flavor",
    description: `${category.label} liked foods and consumables.`,
    items: [...new Map(itemMatches.map((match) => [match[1], { slug: match[1], name: strip(match[3]) }])).values()],
  };
};

export const parseItemDetail = (html, itemSlug, fallbackName) => {
  const titleMatch = html.match(/<title>(.*?) - Pok/i);
  const categoryMatch = html.match(/<td class="cen">\s*([^<]+)<\/td><td class="cen">\s*(?:&nbsp;|([^<]*))<\/td>\s*<td class="cen"><\/td>/i);
  const favoriteMatches = [
    ...html.matchAll(/href="\/pokemonpokopia\/(favorites\/[^"]+\.shtml|flavors\.shtml|pokedex\/flavor\/[^"]+\.shtml)"><u>([^<]+)<\/u>/gi),
  ];
  const recipeMaterials = [
    ...html.matchAll(
      /<tr><td ><a href="([^"]+)\.shtml"><img[^>]*><\/td><td ><a href="[^"]+"><u>([^<]+)<\/u><\/a>\s*\*\s*(\d+)<\/td><\/tr>/gi,
    ),
  ].map((match) => ({
    itemId: itemIdFromSlug(match[1].split("/").at(-1) ?? match[1]),
    itemName: strip(match[2]),
    quantity: Number.parseInt(match[3], 10),
  }));
  const recipeLocationMatch = html.match(
    /<h2>Recipe<\/h2>[\s\S]*?<tr><td class="fooblack">Location<\/td><td class="fooinfo">([\s\S]*?)<\/td><\/tr>/i,
  );
  const recipeLocation = recipeLocationMatch ? strip(recipeLocationMatch[1]) : null;
  const locationsSectionMatch = html.match(/<h2>Locations<\/h2>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
  const obtainabilityDetails = locationsSectionMatch
    ? [
        ...locationsSectionMatch[1].matchAll(
          /<tr><td class="fooblack">([^<]+)<\/td><td class="fooinfo">([\s\S]*?)<\/td><\/tr>/gi,
        ),
      ]
        .map((match) => {
          const label = strip(match[1]);
          const detail = strip(match[2]);
          if (!label && !detail) return null;
          if (!label) return detail;
          if (!detail) return label;
          return `${label}: ${detail}`;
        })
        .filter(Boolean)
    : [];

  return {
    id: itemIdFromSlug(itemSlug),
    sourceSlug: itemSlug,
    name: titleMatch ? strip(titleMatch[1]) : fallbackName,
    itemCategoryLabel: categoryMatch ? strip(categoryMatch[1]) : "Unknown",
    recipeMaterials,
    recipeLocation,
    obtainabilityDetails,
    favoriteCategories: favoriteMatches.map((match) => ({
      label: strip(match[2]),
      sourceType: match[1].includes("flavor") ? "flavor" : "favorite",
      sourceSlug: match[1].includes("pokedex/flavor/")
        ? match[1].replace(/^pokedex\/flavor\//, "").replace(/\.shtml$/, "")
        : match[1].startsWith("favorites/")
          ? match[1].replace(/^favorites\//, "").replace(/\.shtml$/, "")
          : slugify(strip(match[2]).replace(/\s+flavors?$/i, "")),
    })),
  };
};

export const toAbsolute = (path) => new URL(path, ROOT).toString();

export const renderTsModule = (constName, payload) => `export const ${constName} = ${JSON.stringify(payload, null, 2)} as const;\n`;

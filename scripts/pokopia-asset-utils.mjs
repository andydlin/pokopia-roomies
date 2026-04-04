const POKEMON_PAGE_URL = "https://www.serebii.net/pokemonpokopia/availablepokemon.shtml";
const ITEM_PAGE_URL = "https://www.serebii.net/pokemonpokopia/items.shtml";
const HABITAT_PAGE_URL = "https://www.serebii.net/pokemonpokopia/habitats.shtml";
const POKEMON_SRC_PATTERN = /src="(\/pokemonpokopia\/pokemon\/small\/[^"]+\.png)"/gi;
const ITEM_SRC_PATTERN = /src="(items\/[^"]+\.png)"/gi;
const HABITAT_SRC_PATTERN = /src="(habitatdex\/[^"]+\.png)"/gi;

const toAssetId = (filename) => filename.replace(/\.png$/i, "");

const extractRelativeMatches = (html, pageUrl, pattern) => {
  const matches = new Map();
  for (const match of html.matchAll(pattern)) {
    const relativePath = match[1];
    const url = new URL(relativePath, pageUrl).toString();
    const filename = relativePath.split("/").at(-1);
    if (!filename) {
      continue;
    }
    matches.set(filename, { filename, sourceUrl: url });
  }

  return [...matches.values()].sort((left, right) =>
    left.filename.localeCompare(right.filename),
  );
};

export const extractPokemonSpriteSources = (html) =>
  extractRelativeMatches(html, POKEMON_PAGE_URL, POKEMON_SRC_PATTERN);

export const extractItemSpriteSources = (html) =>
  extractRelativeMatches(html, ITEM_PAGE_URL, ITEM_SRC_PATTERN);

export const extractHabitatSpriteSources = (html) =>
  extractRelativeMatches(html, HABITAT_PAGE_URL, HABITAT_SRC_PATTERN);

export const createManifestEntries = (sources, localBasePath) =>
  sources.map(({ filename, sourceUrl }) => ({
    assetId: toAssetId(filename),
    filename,
    localPath: `${localBasePath}/${filename}`,
    sourceUrl,
  }));

export const renderManifestModule = (constName, entries) => {
  const payload = JSON.stringify(entries, null, 2);
  return `import type { AssetManifestEntry } from "../lib/types";

export const ${constName}: AssetManifestEntry[] = ${payload};
`;
};

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createManifestEntries,
  extractHabitatSpriteSources,
  extractItemSpriteSources,
  extractPokemonSpriteSources,
  renderManifestModule,
} from "./pokopia-asset-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const pokemonAssetDir = path.join(projectRoot, "public/assets/pokopia-pokemon");
const itemAssetDir = path.join(projectRoot, "public/assets/pokopia-items");
const habitatAssetDir = path.join(projectRoot, "public/assets/pokopia-habitats");
const pokemonManifestPath = path.join(projectRoot, "src/data/pokopiaPokemonAssetManifest.ts");
const itemManifestPath = path.join(projectRoot, "src/data/pokopiaItemAssetManifest.ts");
const habitatManifestPath = path.join(projectRoot, "src/data/pokopiaHabitatAssetManifest.ts");

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": "pokopia-roomies-asset-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const fetchBinary = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": "pokopia-roomies-asset-sync/1.0",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

const downloadAssets = async (entries, destinationDir) => {
  await mkdir(destinationDir, { recursive: true });
  const downloadedEntries = [];
  const skippedEntries = [];
  for (const entry of entries) {
    try {
      const binary = await fetchBinary(entry.sourceUrl);
      await writeFile(path.join(destinationDir, entry.filename), binary);
      downloadedEntries.push(entry);
    } catch (error) {
      skippedEntries.push({
        ...entry,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { downloadedEntries, skippedEntries };
};

const main = async () => {
  const pokemonPageHtml = await fetchText(
    "https://www.serebii.net/pokemonpokopia/availablepokemon.shtml",
  );
  const itemPageHtml = await fetchText("https://www.serebii.net/pokemonpokopia/items.shtml");
  const habitatPageHtml = await fetchText("https://www.serebii.net/pokemonpokopia/habitats.shtml");

  const pokemonSources = extractPokemonSpriteSources(pokemonPageHtml);
  const itemSources = extractItemSpriteSources(itemPageHtml);
  const habitatSources = extractHabitatSpriteSources(habitatPageHtml).filter(
    (entry) => /^\d+\.png$/i.test(entry.filename),
  );

  const pokemonEntries = createManifestEntries(
    pokemonSources,
    "/assets/pokopia-pokemon",
  );
  const itemEntries = createManifestEntries(itemSources, "/assets/pokopia-items");
  const habitatEntries = createManifestEntries(habitatSources, "/assets/pokopia-habitats");

  const pokemonResult = await downloadAssets(pokemonEntries, pokemonAssetDir);
  const itemResult = await downloadAssets(itemEntries, itemAssetDir);
  const habitatResult = await downloadAssets(habitatEntries, habitatAssetDir);

  await writeFile(
    pokemonManifestPath,
    renderManifestModule("pokopiaPokemonAssetManifest", pokemonResult.downloadedEntries),
  );
  await writeFile(
    itemManifestPath,
    renderManifestModule("pokopiaItemAssetManifest", itemResult.downloadedEntries),
  );
  await writeFile(
    habitatManifestPath,
    renderManifestModule("pokopiaHabitatAssetManifest", habitatResult.downloadedEntries),
  );

  if (
    pokemonResult.skippedEntries.length > 0 ||
    itemResult.skippedEntries.length > 0 ||
    habitatResult.skippedEntries.length > 0
  ) {
    console.warn(
      `Skipped ${pokemonResult.skippedEntries.length} Pokemon sprites, ${itemResult.skippedEntries.length} item sprites, and ${habitatResult.skippedEntries.length} habitat sprites because the upstream URLs were unavailable.`,
    );
  }

  console.log(
    `Synced ${pokemonResult.downloadedEntries.length} Pokemon sprites, ${itemResult.downloadedEntries.length} item sprites, and ${habitatResult.downloadedEntries.length} habitat sprites.`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

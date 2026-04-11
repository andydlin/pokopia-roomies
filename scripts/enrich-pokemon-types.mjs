import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderTsModule, slugify } from "./pokopia-graph-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const pokemonPath = path.join(projectRoot, "src/data/generated/pokemon.ts");
const typeOverridesBySourceSlug = new Map([
  ["paldeanwooper", ["poison", "ground"]],
]);

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "pokopia-roomies-pokemon-types/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const parseGeneratedModule = (raw) => {
  const payload = raw
    .replace(/^export const generatedPokemon = /, "")
    .replace(/ as const;\s*$/, "")
    .trim();
  return JSON.parse(payload);
};

const parseTypeLabels = (html) =>
  [
    ...html.matchAll(/href="\/pokedex-[^/]+\/[^"]+\.shtml"><img[^>]+alt="([^"]+)"[^>]*>/gi),
  ]
    .map((match) => match[1]?.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index);

const main = async () => {
  const raw = await readFile(pokemonPath, "utf8");
  const pokemon = parseGeneratedModule(raw);

  for (let index = 0; index < pokemon.length; index += 1) {
    const entry = pokemon[index];
    const sourceSlug = entry.sourceSlug;
    const url = `https://www.serebii.net/pokemonpokopia/pokedex/${sourceSlug}.shtml`;
    const html = await fetchText(url);
    const typeLabels = parseTypeLabels(html);
    const parsedTypeIds = [...new Set(typeLabels.map(slugify))];
    entry.types =
      parsedTypeIds.length > 0 ? parsedTypeIds : (typeOverridesBySourceSlug.get(sourceSlug) ?? []);
    entry.sourceLabels = {
      ...(entry.sourceLabels ?? {}),
      types: typeLabels.length > 0 ? typeLabels : (entry.types ?? []).map((typeId) => typeId.replace(/^./, (c) => c.toUpperCase())),
    };
    if ((index + 1) % 50 === 0 || index === pokemon.length - 1) {
      console.log(`Processed ${index + 1}/${pokemon.length} Pokemon`);
    }
  }

  await writeFile(pokemonPath, renderTsModule("generatedPokemon", pokemon));
  console.log(`Updated ${pokemonPath} with elemental types`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

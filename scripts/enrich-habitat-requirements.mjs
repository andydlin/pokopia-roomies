import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHabitatRequirements, renderTsModule } from "./pokopia-graph-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const habitatsPath = path.join(projectRoot, "src/data/generated/habitats.ts");

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "pokopia-roomies-habitat-requirements/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const parseGeneratedModule = (raw) => {
  const payload = raw
    .replace(/^export const generatedHabitats = /, "")
    .replace(/ as const;\s*$/, "")
    .trim();
  return JSON.parse(payload);
};

const main = async () => {
  const raw = await readFile(habitatsPath, "utf8");
  const habitats = parseGeneratedModule(raw);

  for (let index = 0; index < habitats.length; index += 1) {
    const habitat = habitats[index];
    if (!habitat?.sourceUrl) {
      habitat.requiredItems = [];
      continue;
    }
    const html = await fetchText(habitat.sourceUrl);
    habitat.requiredItems = parseHabitatRequirements(html);
    if ((index + 1) % 25 === 0 || index === habitats.length - 1) {
      console.log(`Processed ${index + 1}/${habitats.length} habitats`);
    }
  }

  await writeFile(habitatsPath, renderTsModule("generatedHabitats", habitats));
  console.log(`Updated ${habitatsPath} with requiredItems`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

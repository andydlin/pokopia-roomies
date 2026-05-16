export type EnvUnlock = { map: string; level: number };

export function parseEnvUnlocks(obtainabilityDetails: string[]): EnvUnlock[] {
  const raw = obtainabilityDetails.join(" ");
  const seen = new Set<string>();
  const results: EnvUnlock[] = [];

  // "Shop - Unlocked at <Map> Lv. <N>"
  for (const [, map, lvl] of raw.matchAll(/Unlocked at ([A-Za-z ]+?) Lv\. (\d+)/g)) {
    const key = `${map.trim()}:${lvl}`;
    if (!seen.has(key)) { seen.add(key); results.push({ map: map.trim(), level: Number(lvl) }); }
  }

  // "Shop - <Map> Lv. <N>" without "Unlocked at"
  for (const [, map, lvl] of raw.matchAll(/Shop - (?!Unlocked)([A-Za-z ]+?) Lv\. (\d+)/g)) {
    const key = `${map.trim()}:${lvl}`;
    if (!seen.has(key)) { seen.add(key); results.push({ map: map.trim(), level: Number(lvl) }); }
  }

  return results.sort((a, b) => a.map.localeCompare(b.map) || a.level - b.level);
}

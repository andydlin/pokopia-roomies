export interface AssetSource {
  filename: string;
  sourceUrl: string;
}

export interface ManifestEntry {
  assetId: string;
  filename: string;
  localPath: string;
  sourceUrl: string;
}

export function extractPokemonSpriteSources(html: string): AssetSource[];
export function extractItemSpriteSources(html: string): AssetSource[];
export function createManifestEntries(
  sources: AssetSource[],
  localBasePath: string,
): ManifestEntry[];
export function renderManifestModule(constName: string, entries: ManifestEntry[]): string;

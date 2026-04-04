You are implementing a Pokopia roommate group builder in my existing web app.

Inspect the current codebase first and fit the feature into the existing architecture. Use the project’s existing TypeScript, state management, storage, styling, and component patterns whenever possible.

# Goal
Users can:
- search Pokémon by name
- add Pokémon into a roommate group
- save groups
- see a compatibility score and label
- see explanation text
- later inspect which concrete items belong to each favorite category

# Product rules
- minimum group size: 2
- maximum group size: 6
- block adding a 7th Pokémon and show: `Groups can have up to 6 Pokémon.`
- if group size is 5 or 6, show: `Larger groups are harder to optimize. With more than 4 Pokémon, it may be harder to satisfy everyone’s habitat and favorites.`

# Core requirement about favorites
Do not model favorites as plain strings only.
The code must support looking up which concrete items belong to each favorite category.

That means:
- each Pokémon stores `favorites: FavoriteCategoryId[]`
- the app stores canonical favorite category records
- each favorite category stores its concrete items

Use types close to these:

```ts
export type Pokemon = {
  id: string;
  name: string;
  dexNumber?: number;
  imageUrl?: string;
  idealHabitat: string;
  habitats: string[];
  favorites: string[];
  specialties: string[];
  locations: string[];
  timeOfDay?: string[];
  weather?: string[];
};

export type FavoriteItem = {
  id: string;
  name: string;
  imageUrl?: string;
  categoryId: string;
  tags?: string[];
};

export type FavoriteCategory = {
  id: string;
  name: string;
  description?: string;
  items: FavoriteItem[];
};

export type SavedGroup = {
  id: string;
  name: string;
  description?: string;
  pokemonIds: string[];
  createdAt: string;
  updatedAt: string;
  compatibility: {
    score: number;
    label: string;
    summary: string;
    calculatedAt: string;
    version: number;
  };
};
```

# Compatibility engine
Implement four normalized components that return 0–100:
- pair component
- habitat component
- favorites component
- specialty component

## Pair score helpers
```ts
function habitatScore(a: Pokemon, b: Pokemon): number {
  if (a.idealHabitat === b.idealHabitat) return 50;
  const sharedHabitats = intersect(a.habitats, b.habitats).length;
  if (sharedHabitats >= 2) return 40;
  if (sharedHabitats === 1) return 30;
  if (a.habitats.includes(b.idealHabitat) || b.habitats.includes(a.idealHabitat)) return 22;
  return 8;
}

function favoritesScore(a: Pokemon, b: Pokemon): number {
  const shared = intersect(a.favorites, b.favorites).length;
  const maxPossible = Math.max(a.favorites.length, b.favorites.length, 1);
  const ratio = shared / maxPossible;
  if (shared === 0) return 0;
  if (ratio >= 0.75) return 30;
  if (ratio >= 0.5) return 22;
  if (ratio >= 0.25) return 14;
  return 8;
}

function specialtyScore(a: Pokemon, b: Pokemon): number {
  const shared = intersect(a.specialties, b.specialties).length;
  if (shared >= 1) return 6;
  return 8;
}

function contextScore(a: Pokemon, b: Pokemon): number {
  let score = 0;
  if (intersect(a.locations, b.locations).length > 0) score += 4;
  if (a.timeOfDay && b.timeOfDay && intersect(a.timeOfDay, b.timeOfDay).length > 0) score += 3;
  if (a.weather && b.weather && intersect(a.weather, b.weather).length > 0) score += 3;
  return Math.min(score, 10);
}

function pairCompatibility(a: Pokemon, b: Pokemon): number {
  return clamp(Math.round(
    habitatScore(a, b) +
    favoritesScore(a, b) +
    specialtyScore(a, b) +
    contextScore(a, b)
  ), 0, 100);
}
```

## Group scaling for 2–5 Pokémon
Use size-based weights and a trimmed pair average.

```ts
function pairComponent(group: Pokemon[]): number {
  const scores = getAllPairScores(group).sort((a, b) => a - b);
  if (scores.length <= 3) return average(scores);
  return average(scores.slice(1));
}

function habitatComponent(group: Pokemon[]): number {
  const idealCounts = countBy(group.map(p => p.idealHabitat));
  const dominantIdealCount = Math.max(...Object.values(idealCounts));
  const idealAlignment = dominantIdealCount / group.length;

  const sharedHabitats = intersectionOfMany(group.map(p => p.habitats));
  const overlapScore = sharedHabitats.length >= 2 ? 1 : sharedHabitats.length === 1 ? 0.7 : 0;

  return Math.round(idealAlignment * 60 + overlapScore * 40);
}

function favoritesComponent(group: Pokemon[]): number {
  const counts: Record<string, number> = {};
  for (const pokemon of group) {
    for (const fav of pokemon.favorites) {
      counts[fav] = (counts[fav] ?? 0) + 1;
    }
  }

  const size = group.length;
  let total = 0;

  for (const count of Object.values(counts)) {
    const ratio = count / size;
    if (ratio >= 0.8) total += 25;
    else if (ratio >= 0.6) total += 15;
    else if (ratio >= 0.4) total += 8;
  }

  return clamp(total, 0, 100);
}

function specialtyComponent(group: Pokemon[]): number {
  const all = group.flatMap(p => p.specialties);
  const unique = new Set(all).size;
  const ratio = unique / Math.max(group.length, 1);

  if (ratio >= 1) return 100;
  if (ratio >= 0.8) return 85;
  if (ratio >= 0.6) return 70;
  if (ratio >= 0.4) return 55;
  return 40;
}

function getGroupWeights(size: number) {
  if (size <= 2) return { pair: 0.75, habitat: 0.15, favorites: 0.10, specialty: 0.00 };
  if (size === 3) return { pair: 0.65, habitat: 0.20, favorites: 0.10, specialty: 0.05 };
  return { pair: 0.55, habitat: 0.20, favorites: 0.15, specialty: 0.10 };
}

function groupHarmony(group: Pokemon[]): number {
  const weights = getGroupWeights(group.length);
  const total =
    pairComponent(group) * weights.pair +
    habitatComponent(group) * weights.habitat +
    favoritesComponent(group) * weights.favorites +
    specialtyComponent(group) * weights.specialty;

  return clamp(Math.round(total), 0, 100);
}
```

## Labels
- 90–100: Perfect roommates
- 78–89: Great fit
- 64–77: Works well
- 50–63: Works with planning
- 35–49: Tricky setup
- 0–34: Poor fit

## Explanations
Generate explanation objects for pair and group views.

Include:
- reasons
- warnings
- shared favorite categories
- shared favorite items when possible
- best shared habitat or dominant habitat when possible

If no shared favorite categories exist, warn about that.
If no shared habitats exist, warn about that.
If the group has several weak pairs, show: `This group has several weak pairings, so it may need careful habitat planning.`

## Helper APIs to implement
```ts
getItemsForFavoriteCategory(categoryId: string): FavoriteItem[]
getFavoriteCategoriesForPokemon(pokemon: Pokemon): FavoriteCategory[]
getSharedFavoriteCategories(group: Pokemon[]): FavoriteCategory[]
getSharedFavoriteItems(group: Pokemon[]): FavoriteItem[]
scoreToLabel(score: number): string
```

## UI requirements
- support search by Pokémon name
- add/remove Pokémon from a group
- show `x / 6`
- show compatibility live
- show warnings live
- save groups locally using existing app patterns
- store compatibility snapshot on save
- prepare category chips or a details view so a user can inspect which items belong to a favorite category

## Tests
Add tests for:
- habitat scoring
- favorite scoring
- pair compatibility
- group harmony for 2, 3, 4, and 5 Pokémon
- trimmed pair average behavior
- max group size enforcement
- >4 warning behavior
- favorite category -> item lookup
- shared favorite category and item lookups

## Output
After implementing, summarize:
- exact files changed
- what was implemented
- what assumptions were made
- any placeholders still needing real Pokopia data

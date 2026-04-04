# Compatibility Algorithm

## Goal
Scale cleanly for groups of 2–5 Pokémon while still supporting up to 6 in the UI.

The algorithm should avoid two common problems:
- larger groups being punished too harshly by raw pair averaging
- one bad pair dragging down an otherwise workable group

## Model
Use four normalized components, each returning 0–100:
1. pair component
2. habitat component
3. favorites component
4. specialty component

## Final formula
The weights should change by group size.

### 2 Pokémon
```ts
{
  pair: 0.75,
  habitat: 0.15,
  favorites: 0.10,
  specialty: 0.00,
}
```

### 3 Pokémon
```ts
{
  pair: 0.65,
  habitat: 0.20,
  favorites: 0.10,
  specialty: 0.05,
}
```

### 4–5 Pokémon
```ts
{
  pair: 0.55,
  habitat: 0.20,
  favorites: 0.15,
  specialty: 0.10,
}
```

### Optional 6 Pokémon handling
For 6 Pokémon, use the same as 4–5 and keep the large-group warning visible.

## Pair component
Use a trimmed average rather than a raw average.

- 2 Pokémon: use the only pair score
- 3 Pokémon: average all 3 pair scores
- 4–5 Pokémon: drop the single worst pair, then average
- 6 Pokémon: also drop the single worst pair, but rely on the warning to communicate complexity

```ts
function pairComponent(group: Pokemon[]): number {
  const scores = getAllPairScores(group).sort((a, b) => a - b);

  if (scores.length <= 3) return average(scores);
  return average(scores.slice(1));
}
```

## Pair score itself
The pair score should still be based on:
- habitat fit
- favorite category overlap
- lightweight specialty synergy
- lightweight context affinity

### Habitat score
```ts
function habitatScore(a: Pokemon, b: Pokemon): number {
  if (a.idealHabitat === b.idealHabitat) return 50;

  const sharedHabitats = intersect(a.habitats, b.habitats).length;
  if (sharedHabitats >= 2) return 40;
  if (sharedHabitats === 1) return 30;

  if (a.habitats.includes(b.idealHabitat) || b.habitats.includes(a.idealHabitat)) {
    return 22;
  }

  return 8;
}
```

### Favorite category score
```ts
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
```

### Specialty score
```ts
function specialtyScore(a: Pokemon, b: Pokemon): number {
  const shared = intersect(a.specialties, b.specialties).length;
  if (shared >= 1) return 6;
  return 8;
}
```

### Context score
```ts
function contextScore(a: Pokemon, b: Pokemon): number {
  let score = 0;

  if (intersect(a.locations, b.locations).length > 0) score += 4;
  if (a.timeOfDay && b.timeOfDay && intersect(a.timeOfDay, b.timeOfDay).length > 0) score += 3;
  if (a.weather && b.weather && intersect(a.weather, b.weather).length > 0) score += 3;

  return Math.min(score, 10);
}
```

### Final pair compatibility
```ts
function pairCompatibility(a: Pokemon, b: Pokemon): number {
  const score =
    habitatScore(a, b) +
    favoritesScore(a, b) +
    specialtyScore(a, b) +
    contextScore(a, b);

  return clamp(Math.round(score), 0, 100);
}
```

## Habitat component for groups
This should evaluate whether the whole group is solveable, not just whether pairs happen to overlap.

```ts
function habitatComponent(group: Pokemon[]): number {
  const idealCounts = countBy(group.map(p => p.idealHabitat));
  const dominantIdealCount = Math.max(...Object.values(idealCounts));
  const idealAlignment = dominantIdealCount / group.length;

  const sharedHabitats = intersectionOfMany(group.map(p => p.habitats));
  const overlapScore =
    sharedHabitats.length >= 2 ? 1 :
    sharedHabitats.length === 1 ? 0.7 :
    0;

  const score = idealAlignment * 60 + overlapScore * 40;
  return Math.round(score);
}
```

## Favorites component for groups
Do not require all members to share the same favorite category. That is too strict for 4–5 Pokémon.

Use favorite frequency coverage instead.

```ts
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
```

## Specialty component for groups
Keep it light.

```ts
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
```

## Final group harmony
```ts
function getGroupWeights(size: number) {
  if (size <= 2) {
    return { pair: 0.75, habitat: 0.15, favorites: 0.10, specialty: 0.00 };
  }

  if (size === 3) {
    return { pair: 0.65, habitat: 0.20, favorites: 0.10, specialty: 0.05 };
  }

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

## Warnings
### Large-group warning
If group size is 5 or 6:
`Larger groups are harder to optimize. With more than 4 Pokémon, it may be harder to satisfy everyone’s habitat and favorites.`

### Weak-pair warning
```ts
function weakPairWarning(group: Pokemon[]): string | null {
  const scores = getAllPairScores(group);
  const weakPairs = scores.filter(score => score < 45).length;
  const ratio = weakPairs / scores.length;

  if (ratio >= 0.4) {
    return "This group has several weak pairings, so it may need careful habitat planning.";
  }

  return null;
}
```

## Score labels
- 90–100: Perfect roommates
- 78–89: Great fit
- 64–77: Works well
- 50–63: Works with planning
- 35–49: Tricky setup
- 0–34: Poor fit

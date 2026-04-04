# Data Model

## Overview
The model should separate:
- canonical Pokémon data
- canonical favorite categories
- canonical items
- saved groups
- derived compatibility output

## Core entities

### Pokemon
```ts
export type Pokemon = {
  id: string;
  name: string;
  dexNumber?: number;
  imageUrl?: string;

  idealHabitat: string;
  habitats: string[];

  favorites: string[];      // FavoriteCategoryId[]
  specialties: string[];

  locations: string[];
  timeOfDay?: string[];
  weather?: string[];
};
```

### FavoriteCategory
```ts
export type FavoriteCategory = {
  id: string;
  name: string;
  description?: string;
  items: FavoriteItem[];
};
```

### FavoriteItem
```ts
export type FavoriteItem = {
  id: string;
  name: string;
  imageUrl?: string;
  categoryId: string;
  tags?: string[];
};
```

### Habitat
```ts
export type Habitat = {
  id: string;
  name: string;
  description?: string;
};
```

### Specialty
```ts
export type Specialty = {
  id: string;
  name: string;
  description?: string;
};
```

### SavedGroup
```ts
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

### PairExplanation
```ts
export type PairExplanation = {
  score: number;
  reasons: string[];
  warnings: string[];
  bestSharedHabitat?: string;
  sharedFavorites: string[];
  sharedFavoriteItems?: FavoriteItem[];
};
```

### GroupExplanation
```ts
export type GroupExplanation = {
  score: number;
  label: string;
  summary: string;
  reasons: string[];
  warnings: string[];
  sharedFavorites: string[];
  sharedFavoriteItems?: FavoriteItem[];
  dominantHabitat?: string;
  pairBreakdown: Array<{
    pair: [string, string];
    score: number;
  }>;
};
```

## Recommended lookup structures
To make the app fast and simple, maintain these maps at runtime:

```ts
pokemonById: Record<string, Pokemon>
favoriteCategoryById: Record<string, FavoriteCategory>
favoriteItemsByCategoryId: Record<string, FavoriteItem[]>
```

## Key requirement for favorites
Do not model favorites as plain display strings only.

Bad:
```ts
favorites: ["Cute Stuff", "Plants"]
```

Better:
```ts
favorites: ["cute_stuff", "plants"]
```
with canonical lookup data:
```ts
favoriteCategories = [
  {
    id: "cute_stuff",
    name: "Cute Stuff",
    items: [
      { id: "plush_pillow", name: "Plush Pillow", categoryId: "cute_stuff" },
      { id: "toy_lamp", name: "Toy Lamp", categoryId: "cute_stuff" }
    ]
  }
]
```

## Why this matters
This allows the app to:
- show item lists for a favorite category
- list item overlaps for roommate groups
- later recommend one shared set of items that satisfies multiple Pokémon

## Future-ready helper outputs
Add helpers like:
```ts
getFavoriteCategoriesForPokemon(pokemon: Pokemon): FavoriteCategory[]
getItemsForFavoriteCategory(categoryId: string): FavoriteItem[]
getSharedFavoriteCategories(group: Pokemon[]): FavoriteCategory[]
getSharedFavoriteItems(group: Pokemon[]): FavoriteItem[]
```

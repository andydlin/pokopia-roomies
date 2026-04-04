# Suggested Data Model

## Pokémon entity

```ts
export type PokemonEntry = {
  id: string;
  number: number;
  slug: string;
  name: string;
  image?: string;
  idealHabitat: string;
  specialties: string[];
  favorites: string[];
  favoriteItemCategories: string[];
  tags?: string[];
  evolutionFamily?: string;
  notes?: string;
};
```

## Why these fields exist
- `id`: internal stable identifier
- `number`: numeric sorting and display
- `slug`: route-safe key
- `name`: visible label
- `image`: sprite/art path
- `idealHabitat`: major discovery/filter field
- `specialties`: major filter and comparison field
- `favorites`: core player planning field
- `favoriteItemCategories`: future bridge to item explorer
- `tags`: flexible search hooks
- `evolutionFamily`: optional family grouping
- `notes`: future editorial or scraped notes

## Derived fields to compute in code
- `compatibilityPotential`
- `sharedFavoriteCounts`
- `relatedPokemon`
- available filter option lists

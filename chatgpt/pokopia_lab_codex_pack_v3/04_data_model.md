# Exact Data Model

## Core type design goals
- normalized enough for reusable selectors
- simple enough for local JSON
- future-ready for DB migration
- allow category-level and item-level reasoning

## TypeScript types

```ts
export type ID = string;

export type HabitatAxis =
  | "light"
  | "moisture"
  | "temperature"
  | "activity";

export type HabitatTraitValue =
  | "bright"
  | "dark"
  | "humid"
  | "dry"
  | "warm"
  | "cool"
  | "lively"
  | "quiet";

export interface HabitatTrait {
  id: ID;
  axis: HabitatAxis;
  value: HabitatTraitValue;
  label: string;
  oppositeTraitId?: ID;
}

export interface FavoriteCategory {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  itemIds: ID[];
}

export interface ItemSource {
  type: "craft" | "shop" | "field" | "event" | "unknown";
  label: string;
}

export interface CraftMaterial {
  itemName: string;
  quantity: number;
}

export interface Item {
  id: ID;
  name: string;
  slug: string;
  favoriteCategoryIds: ID[];
  habitatTraitIds?: ID[];
  craftable: boolean;
  materials?: CraftMaterial[];
  sources?: ItemSource[];
}

export interface Specialty {
  id: ID;
  name: string;
  slug: string;
  description?: string;
}

export interface Location {
  id: ID;
  name: string;
  slug: string;
  notes?: string;
}

export interface Pokemon {
  id: ID;
  dexNumber?: number;
  name: string;
  slug: string;
  specialtyId: ID;
  favoriteCategoryIds: ID[];
  idealHabitatTraitIds: ID[];
  locationIds: ID[];
  imageUrl?: string;
}

export interface SavedTeam {
  id: ID;
  name: string;
  pokemonIds: ID[];
  createdAt: string;
  updatedAt: string;
}

export interface PairScoreBreakdown {
  pokemonAId: ID;
  pokemonBId: ID;
  sharedFavoriteCategoryIds: ID[];
  matchingHabitatTraitIds: ID[];
  conflictingHabitatPairs: Array<{ traitAId: ID; traitBId: ID }>;
  specialtyModifier: number;
  score: number;
}

export interface TeamScoreBreakdown {
  teamPokemonIds: ID[];
  pairBreakdowns: PairScoreBreakdown[];
  sharedFavoriteCategoryIdsAll: ID[];
  sharedFavoriteCategoryIdsAny: ID[];
  matchingHabitatTraitIdsAll: ID[];
  conflictingHabitatPairs: Array<{
    pokemonAId: ID;
    pokemonBId: ID;
    traitAId: ID;
    traitBId: ID;
  }>;
  recommendedFavoriteCategoryIds: ID[];
  recommendedItemIds: ID[];
  totalScore: number;
  summaryLabel: "excellent" | "good" | "mixed" | "poor";
}

export interface ItemRecommendation {
  itemId: ID;
  matchedPokemonIds: ID[];
  matchedFavoriteCategoryIds: ID[];
  score: number;
  reasons: string[];
}
```

## Optional vs required
Required for Pokémon:
- id
- name
- slug
- specialtyId
- favoriteCategoryIds
- idealHabitatTraitIds
- locationIds

Optional:
- dexNumber
- imageUrl

Required for Items:
- id
- name
- slug
- favoriteCategoryIds
- craftable

Optional:
- habitatTraitIds
- materials
- sources

## Suggested data folder structure

```txt
/data
  pokemon.json
  items.json
  favoriteCategories.json
  habitatTraits.json
  specialties.json
  locations.json
```

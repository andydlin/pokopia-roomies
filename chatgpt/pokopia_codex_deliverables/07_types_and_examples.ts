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

export type PairExplanation = {
  score: number;
  reasons: string[];
  warnings: string[];
  bestSharedHabitat?: string;
  sharedFavorites: string[];
  sharedFavoriteItems?: FavoriteItem[];
};

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

export const exampleFavoriteCategories: FavoriteCategory[] = [
  {
    id: 'plants',
    name: 'Plants',
    description: 'Natural greenery and plant-like decorations.',
    items: [
      { id: 'potted_plant', name: 'Potted Plant', categoryId: 'plants' },
      { id: 'flower_patch', name: 'Flower Patch', categoryId: 'plants' },
    ],
  },
  {
    id: 'cute_stuff',
    name: 'Cute Stuff',
    description: 'Cute and playful decorative items.',
    items: [
      { id: 'plush_pillow', name: 'Plush Pillow', categoryId: 'cute_stuff' },
      { id: 'toy_lamp', name: 'Toy Lamp', categoryId: 'cute_stuff' },
    ],
  },
];

export const examplePokemon: Pokemon[] = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    idealHabitat: 'bright',
    habitats: ['bright', 'park'],
    favorites: ['cute_stuff', 'plants'],
    specialties: ['search'],
    locations: ['starter_meadow'],
    timeOfDay: ['day'],
    weather: ['clear'],
  },
  {
    id: 'bulbasaur',
    name: 'Bulbasaur',
    idealHabitat: 'bright',
    habitats: ['bright', 'garden'],
    favorites: ['plants'],
    specialties: ['grow'],
    locations: ['starter_meadow'],
    timeOfDay: ['day'],
    weather: ['clear'],
  },
];

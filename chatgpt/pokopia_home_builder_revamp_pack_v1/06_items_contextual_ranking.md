# Items Contextual Ranking

## Product rule
All items are addable.
Some items affect comfort; some are neutral.
Neutral items must never be penalized, but comfort-relevant items should be prioritized when relevant.

## Item model
```ts
export type Item = {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  generalCategoryId: string;
  generalCategoryLabel: string;
  comfortCategoryIds: string[];
  comfortCategoryLabels: string[];
  isComfortRelevant: boolean;
};
```

`isComfortRelevant = comfortCategoryIds.length > 0`

## Home-derived category strength
```ts
export type HomeCategoryStrength = {
  categoryId: string;
  count: number;
  totalPokemon: number;
  shareType: 'all' | 'most' | 'some' | 'single';
};
```

## Category coverage state
```ts
export type CategoryCoverageState = {
  categoryId: string;
  demandCount: number;
  supplyCount: number;
  state: 'missing' | 'partial' | 'covered' | 'overcovered';
};
```

## Ranked item model
```ts
export type RankedItem = {
  item: Item;
  score: number;
  bucket: 'best_match' | 'supporting_match' | 'neutral';
  matchedCategoryIds: string[];
  matchedShareTypes: Array<'all' | 'most' | 'some' | 'single'>;
  fillsMissingCategoryIds: string[];
  fillsPartialCategoryIds: string[];
};
```

## Exact scoring weights
Share-type weights:
- all = +100
- most = +70
- some = +35
- single = +10

Coverage bonuses:
- missing = +25
- partial = +10
- covered = +0
- overcovered = -5

Multi-match bonus:
- each additional matched relevant category after the first = +15

Neutral behavior:
- no comfort tags => score 0, neutral
- comfort tags but no overlap => score 0, neutral

## Pseudocode
```ts
export function rankItemForHomeContext(
  item: Item,
  categoryStrengthById: Record<string, HomeCategoryStrength>,
  coverageByCategoryId: Record<string, CategoryCoverageState>,
): RankedItem {
  if (!item.isComfortRelevant) {
    return {
      item,
      score: 0,
      bucket: 'neutral',
      matchedCategoryIds: [],
      matchedShareTypes: [],
      fillsMissingCategoryIds: [],
      fillsPartialCategoryIds: [],
    };
  }

  let score = 0;
  const matchedCategoryIds: string[] = [];
  const matchedShareTypes: Array<'all' | 'most' | 'some' | 'single'> = [];
  const fillsMissingCategoryIds: string[] = [];
  const fillsPartialCategoryIds: string[] = [];

  for (const categoryId of item.comfortCategoryIds) {
    const strength = categoryStrengthById[categoryId];
    if (!strength) continue;

    matchedCategoryIds.push(categoryId);
    matchedShareTypes.push(strength.shareType);

    if (strength.shareType === 'all') score += 100;
    else if (strength.shareType === 'most') score += 70;
    else if (strength.shareType === 'some') score += 35;
    else if (strength.shareType === 'single') score += 10;

    const coverage = coverageByCategoryId[categoryId];
    if (coverage?.state === 'missing') {
      score += 25;
      fillsMissingCategoryIds.push(categoryId);
    } else if (coverage?.state === 'partial') {
      score += 10;
      fillsPartialCategoryIds.push(categoryId);
    } else if (coverage?.state === 'overcovered') {
      score -= 5;
    }
  }

  if (matchedCategoryIds.length > 1) {
    score += (matchedCategoryIds.length - 1) * 15;
  }

  let bucket: 'best_match' | 'supporting_match' | 'neutral' = 'neutral';

  if (score >= 100 || matchedShareTypes.includes('all') || matchedShareTypes.includes('most')) {
    bucket = 'best_match';
  } else if (score > 0) {
    bucket = 'supporting_match';
  }

  return {
    item,
    score,
    bucket,
    matchedCategoryIds,
    matchedShareTypes,
    fillsMissingCategoryIds,
    fillsPartialCategoryIds,
  };
}
```

## Items browser sections in contextual mode
1. Best for this Home
2. Helps Support this Home
3. Decorative / Structural Items

Sort orders:
- Best: score desc, matched categories desc, missing filled desc, alpha
- Supporting: score desc, missing before partial, alpha
- Neutral: general category, alpha

## Browse modes
```ts
export type ItemBrowseMode = 'contextual' | 'all';
export type ItemBrowseIntent = 'best_fit' | 'missing_categories' | 'all_items';
```

Rules:
- if at least 1 Pokémon selected, default to contextual
- if none selected, default to all
- user can switch modes anytime
- filters still apply inside either mode

## Important filter rule
General category filters like Blocks, Furniture, Outdoor, etc. must still work.
If a filtered set contains only neutral items, still show them.
Never show a broken empty experience just because nothing affects comfort.

# Item Contextual Ranking Spec

## Neutral item rule
Items without comfort tags are always allowed and must remain browseable.
They do not contribute to or reduce comfort.

## Ranking buckets

```ts
export type RankedItemBucket = "best_match" | "supporting_match" | "neutral";

export type RankedItem = {
  item: Item;
  score: number;
  bucket: RankedItemBucket;
  matchedCategoryIds: string[];
  matchedShareTypes: Array<"all" | "most" | "some" | "single">;
  fillsMissingCategoryIds: string[];
  fillsPartialCategoryIds: string[];
};
```

## Weights
- overlap with `all`: +100
- overlap with `most`: +70
- overlap with `some`: +35
- overlap with `single`: +10
- overlaps `missing`: +25
- overlaps `partial`: +10
- overlaps `overcovered`: -5
- each additional matched relevant category after the first: +15

## Bucketing
- `best_match` if score >= 100 or any overlap with `all` or `most`
- `supporting_match` if score > 0 and not best_match
- `neutral` otherwise

## Sections
1. Best for this home
2. Helps support this home
3. Decorative & structural items

## Mode control
- contextual mode if at least one pokemon selected
- all mode if no pokemon selected
- user can manually switch

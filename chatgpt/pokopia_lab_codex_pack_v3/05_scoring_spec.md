# Compatibility Scoring Specification

## Goal
Produce a compatibility score for a group of 2–5 Pokémon that is:
- explainable
- easy to tune
- stable across team sizes
- based on transparent factors

## Philosophy
The strongest signal is favorite overlap.
Habitat alignment matters next.
Habitat conflicts should be visible and meaningfully penalized.
Specialty is a weak modifier for MVP.

## Weight constants
Suggested initial constants:

```ts
export const SCORE_WEIGHTS = {
  SHARED_FAVORITE_PER_CATEGORY: 8,
  MATCHING_HABITAT_TRAIT: 4,
  CONFLICTING_HABITAT_TRAIT: -6,
  SAME_SPECIALTY: 1,
  DIFFERENT_SPECIALTY: 0,
  ALL_TEAM_SHARED_FAVORITE_BONUS: 6,
  ALL_TEAM_SHARED_HABITAT_BONUS: 4,
  ITEM_COVERAGE_PER_MATCHED_POKEMON: 3,
  CRAFTABLE_ITEM_BONUS: 1,
};
```

## Pairwise scoring
For each unique pair in the team:
1. Shared favorite categories:
   - +8 per shared category
2. Matching habitat traits:
   - +4 per exact shared ideal habitat trait
3. Conflicting habitat traits:
   - -6 when one Pokémon prefers the direct opposite of another on the same axis
4. Specialty:
   - optional +1 if same specialty
   - otherwise 0

Pair score formula:

```ts
pairScore =
  (sharedFavoriteCount * 8) +
  (matchingHabitatCount * 4) +
  (conflictingHabitatCount * -6) +
  specialtyModifier
```

## Team-level bonuses
After pairwise scoring:
- if all team members share a favorite category: +6 per category
- if all team members share a habitat trait: +4 per trait

## Team normalization
Because 5-Pokémon teams have more pairs than 2-Pokémon teams, normalize:

```ts
normalizedScore = Math.round(rawPairTotal / pairCount + teamBonuses)
```

Or:
- keep raw score for internal detail
- display normalized score for user-facing score
- optionally map to bands:
  - 18+ excellent
  - 10–17 good
  - 3–9 mixed
  - <=2 poor

## Shared favorites outputs
Return:
- shared across all members
- shared across at least 2 members
- per-pair favorite overlaps

## Habitat conflict logic
Each habitat trait belongs to an axis:
- light: bright vs dark
- moisture: humid vs dry
- temperature: warm vs cool
- activity: lively vs quiet

A conflict occurs only when opposite values on same axis appear across pair.

## Recommended categories
Rank favorite categories by:
1. how many selected Pokémon prefer them
2. whether category has many mapped items
3. optional secondary alphabetical tie-break

## Recommended items
For each item:
- derive which selected Pokémon it helps via favorite category overlap
- score:
  - +3 per matched Pokémon
  - +1 if craftable
- sort descending

## Example interpretation
A team with:
- two shared favorite categories
- one shared habitat trait
- no conflicts

Will generally score better than a team with:
- one shared favorite
- two habitat conflicts

This keeps the system intuitive to users.

# Implementation Tasks

## Phase 1 — Data structures
- create canonical `Pokemon` type
- create canonical `FavoriteCategory` type
- create canonical `FavoriteItem` type
- add runtime lookup maps
- ensure `favorites` on Pokémon store stable IDs, not raw display strings

## Phase 2 — Core compatibility engine
- implement pair scoring helpers
- implement group scoring helpers
- implement size-based weights
- implement warnings
- implement score-to-label helper
- implement explanation builders

## Phase 3 — Favorite category to item support
- implement `getItemsForFavoriteCategory(categoryId)`
- implement `getFavoriteCategoriesForPokemon(pokemon)`
- implement `getSharedFavoriteCategories(group)`
- implement `getSharedFavoriteItems(group)`
- ensure explanation objects can carry shared favorite items

## Phase 4 — UI integration
- wire search by Pokémon name
- wire add/remove group builder behavior
- show count and cap
- show score and label live
- show warnings live
- show favorite category detail support
- prepare UI hook or component for category -> item reveal

## Phase 5 — Save groups
- implement local persistence using the project's existing storage style
- store compatibility snapshot on save
- store `version = 1`

## Phase 6 — Tests
Add tests for:
- habitat score
- favorites score
- pair score
- group score by size 2, 3, 4, 5
- trimming behavior for 4–5 Pokémon
- large-group warning
- max group size enforcement
- favorite category -> item lookup
- shared favorite categories and items

## Phase 7 — Nice extras if easy
- dominant habitat chip
- expandable pair breakdown
- category chip that reveals items

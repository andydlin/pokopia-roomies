# Suggested Repo Structure

```txt
/app
  /compare
    page.tsx
  /dex
    page.tsx
  /items
    page.tsx
  /lookup
    page.tsx
  /pokemon/[slug]
    page.tsx
  /teams
    page.tsx
  /teams/[id]
    page.tsx
  layout.tsx
  page.tsx

/components
  /layout
    AppHeader.tsx
    AppShell.tsx
  /pokemon
    PokemonCard.tsx
    PokemonCombobox.tsx
    PokemonTagRow.tsx
  /items
    ItemRecommendationCard.tsx
    SharedFavoritesCard.tsx
  /lookup
    LookupFilters.tsx
    LookupResultsGrid.tsx
  /teams
    TeamCard.tsx
    TeamBuilder.tsx
    TeamComparePanel.tsx
  /common
    Chip.tsx
    EmptyState.tsx
    ScoreBadge.tsx
    SectionCard.tsx

/data
  pokemon.json
  items.json
  favoriteCategories.json
  habitatTraits.json
  specialties.json
  locations.json

/lib
  /data
    loaders.ts
    selectors.ts
  /scoring
    constants.ts
    getSharedFavorites.ts
    getHabitatConflicts.ts
    getRecommendedItems.ts
    scorePair.ts
    scoreTeam.ts
  /teams
    storage.ts
    teamHelpers.ts
  /utils
    array.ts
    labels.ts

/types
  domain.ts

/public
  /images/pokemon

/scripts
  /import
    README.md
    normalize.ts
```

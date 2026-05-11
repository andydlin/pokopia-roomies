# Route and Navigation Spec

## Routes

```text
/                         -> redirect to /builder
/builder                  -> HomeBuilderPage (default tab preserved or pokemon)
/builder/pokemon          -> HomeBuilderPage + pokemon browse
/builder/items            -> HomeBuilderPage + items browse
/builder/habitats         -> HomeBuilderPage + habitats browse
/homes                    -> SavedHomesPage
/pokedex                  -> redirect to /pokedex/pokemon
/pokedex/pokemon          -> neutral pokemon browser
/pokedex/items            -> neutral item browser
/pokedex/habitats         -> neutral habitat browser
```

## Query params for builder
- `q`: search query
- `mode`: contextual | all
- `intent`: builder browse intent
- `generalCategory`: item general category id
- `comfortCategory`: item comfort category id
- `favoriteCategory`: pokemon favorite category id
- `habitat`: habitat id
- `detail`: current detail entity id if applicable

## Navigation rules
- Browser back should preserve tab and browse filters.
- In-app back actions must exist for detail views and builder-linked browse flows.
- Full Home view actions should deep-link into the same browse routes with URL state.
- Loading a saved home must not drop the user out of current route/tab.
- Mobile and desktop should share the same route model.

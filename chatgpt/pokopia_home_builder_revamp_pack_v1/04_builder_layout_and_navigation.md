# Home Builder Layout and Navigation

## Core principle
The home being built must always be accessible, while browsing gets most of the screen space.

## Desktop layout
Use a two-column layout:
- Left: sticky compact Home panel (~320–380px)
- Right: main browser area (scrollable and dominant)

### Sticky Home panel contents
- Home name + save controls + continue/restore access
- Pokémon section (collapsible)
- Habitat section
- Items section (collapsible)
- Quick summary
- Button to open full/expanded Home view

### Expanded Home view
Use a drawer, modal, or full overlay that shows:
- all selected Pokémon
- selected habitat
- all selected items
- deeper contextual summary
- quick jump actions:
  - Browse best-fit items
  - Browse items for missing categories
  - Browse compatible Pokémon
  - Browse suggested habitats

## Mobile layout
Use:
- full-screen browser by default
- sticky bottom builder bar
- expandable bottom sheet for the current Home

The bottom sheet should mirror the compact desktop builder panel and support opening a fuller Home view.

## Browse tabs inside builder
Within Home Builder, support tabs for:
- Pokémon
- Items
- Habitats

These are builder-context tabs, not top-level site pages.

## Navigation rules
Preserve easy back-and-forth movement.
Do not rely only on browser back.

Support explicit return actions such as:
- Back to results
- Back to your home
- Back to compatible items
- Back to compatible Pokémon
- Back to compatible habitats

Use URL-backed state where reasonable to preserve:
- active builder tab
- search query
- browse mode
- filters
- contextual intent
- selected detail entity if practical

## Browse philosophy
Never remove access to the full dataset.
Instead:
- default to contextual ranking when a Home exists
- keep a visible switch to browse all
- use sectioning and ranking, not hard restrictions

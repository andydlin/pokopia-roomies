# Information Architecture + Screen Notes

## Home `/`
Purpose:
- quick entry into major tools
- explain value proposition

Sections:
- hero / intro
- 4 primary tool cards
- recent teams (if any)
- “popular categories” / “flexible Pokémon” optional widgets

## Item Optimizer `/items`
Layout:
- left: Pokémon multi-select panel
- right: results
Sections:
- selected Pokémon strip
- shared favorites
- partial overlaps
- recommended categories
- recommended items
- team summary card

## Reverse Lookup `/lookup`
Layout:
- filter rail or top filter bar
- results grid
Filters:
- favorite category
- item
- habitat trait
- specialty
Results:
- Pokémon cards with matched reasons

## Pokémon detail `/pokemon/[slug]`
Sections:
- header with Pokémon basics
- favorites
- habitat traits
- specialty
- locations
- compatibility explorer list
- add teammate to draft team

## Teams `/teams`
Sections:
- saved team cards
- create new team CTA
- empty state

## Team detail `/teams/[id]`
Sections:
- team header
- members
- score summary
- favorite overlap
- habitat compatibility/conflicts
- recommended categories/items
- compare CTA

## Compare `/compare`
Layout:
- two selectors at top
- side-by-side panels
Rows:
- score
- shared favorites
- conflicts
- recommended categories
- recommended items
- summary verdict

## Smart Dex `/dex`
Purpose:
- searchable explorer
Features:
- filters
- sorting
- compact cards
Potential sorts:
- A-Z
- most flexible
- highest item coverage potential

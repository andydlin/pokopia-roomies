# UI / UX Requirements

## Group builder
The main builder should support:
- Pokémon name search
- add/remove Pokémon
- visible group size counter, e.g. `3 / 6`
- live compatibility score and label
- live explanation text
- save group flow

## Group-size rules
- hard cap at 6
- block adding the 7th Pokémon
- show non-blocking warning for group sizes 5 and 6

## Compatibility presentation
Show:
- large numeric score
- label
- short summary
- reasons list
- warnings list

## Pair breakdown
In details view, show:
- each pair
- pair score
- pair reasons and warnings on demand

## Favorite category detail support
The UI should be able to show, for any favorite category:
- category name
- category description, if available
- concrete items in that category

This can appear as:
- tooltip
- details panel
- drawer
- modal

The data model must support all of those without refactoring.

## Group-level favorite item support
The UI should later be able to surface:
- shared favorite categories across a group
- item suggestions for those categories
- category chips that can expand to reveal items

## Empty states
- no Pokémon selected: prompt user to add Pokémon
- one Pokémon selected: explain that at least 2 are needed for compatibility
- no shared habitats: show a habitat difficulty warning
- no shared favorite categories: show a favorites mismatch warning

## Suggested explanation tone
Keep the writing playful but clear.

Examples:
- `This group fits well because most members share a habitat theme and several favorite categories.`
- `This group can work, but it may need careful habitat planning to satisfy everyone.`
- `This group has weak overlap in habitat and favorites, so it may be difficult to keep everyone comfortable.`

## Saved groups list
Each saved group card should show:
- group name
- Pokémon count
- compatibility score
- label
- updated date

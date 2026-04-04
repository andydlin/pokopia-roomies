# Project Brief

## Product
A web tool for Pokémon Pokopia where people can:
- search Pokémon by name
- add Pokémon into a roommate group
- save groups
- see a compatibility score
- see explanation text for why the group works or does not work
- later inspect which concrete items belong to each favorite category

## Core product idea
The app is not just a group builder. It is a "can these Pokémon comfortably live together in the same designed space" tool.

## MVP goals
- search by Pokémon name
- add/remove Pokémon from a group
- support group sizes from 2 to 6
- show a warning when group size is greater than 4
- compute compatibility live while the group is being edited
- save groups locally
- store compatibility snapshot on save
- expose favorite category -> item mapping in the data model and UI hooks

## Product rules
- minimum group size: 2
- maximum group size: 6
- when user tries to add a 7th Pokémon, block it and show: `Groups can have up to 6 Pokémon.`
- when group size is 5 or 6, show: `Larger groups are harder to optimize. With more than 4 Pokémon, it may be harder to satisfy everyone’s habitat and favorites.`

## Compatibility philosophy
Compatibility should be driven mostly by:
1. habitat alignment
2. favorite category overlap
3. whole-group habitat solveability
4. lightweight specialty balance

Location, time of day, and weather can act as weak tie-breakers rather than dominant factors.

## Why favorite-category-to-item mapping matters
The app needs to understand not only that a Pokémon likes category X, but also which concrete items satisfy category X. This makes the system future-proof for:
- item recommendation UI
- shared-item suggestions for a group
- item lookup from category detail views
- future "best room setup" features

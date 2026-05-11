# Product Direction

## Core reframing
The website is no longer a collection of separate utilities like group builder, item browser, and habitat browser.

It is now a home-building system where users assemble a Home and get contextual help.

## Central object: Home
A Home contains:
- Pokémon (0–6)
- Items (0–N)
- Habitat (0 or 1)
- optional inferred theme later

Suggested core type:

```ts
export type HomeState = {
  id?: string | null;
  name: string;
  pokemonIds: string[];
  itemIds: string[];
  habitatId: string | null;
};
```

## Core product behavior
Users should be able to:
- pick Pokémon and see what items/habitat fit
- pick items and see what Pokémon/habitat fit
- pick a habitat and see what Pokémon/items fit
- load an existing home and improve it
- save multiple homes
- restore their homes on another device without creating an account

## Non-goals
- No numeric score display
- No forced wizard flow
- No strict lock-in to only compatible options
- No account creation requirement

## Product rule
Suggestions are a guidance layer, not a constraint system.

Users must always be able to:
- add any Pokémon
- add any item
- select any habitat

regardless of whether the system considers it a strong fit.

The product should feel like:
"You can build anything, and we’ll help you understand the tradeoffs."

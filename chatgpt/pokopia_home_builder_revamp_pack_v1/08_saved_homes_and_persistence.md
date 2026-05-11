# Saved Homes and Persistence

## Saved Homes requirements
Users must be able to:
- save current home
- load a saved home
- update a saved home
- duplicate a home
- delete a home

Suggested model:
```ts
export type SavedHome = {
  id: string;
  name: string;
  pokemonIds: string[];
  itemIds: string[];
  habitatId: string | null;
  createdAt: number;
  updatedAt: number;
};
```

## UX requirements
- quick save from builder header
- quick access to saved homes from builder shell
- dedicated Saved Homes page for management
- opening a home should update the current builder immediately
- switching homes should not destroy browsing context unless intentionally reset

## Persistence strategy
Use local-first persistence.
Persist:
- current home
- saved homes
- relevant lightweight builder preferences if useful

## Important architecture rule
Do not hardcode business logic directly to localStorage.
Wrap persistence behind adapters.

Suggested interfaces:
```ts
export type PersistedLocalState = {
  currentHome: CurrentHomeState | null;
  savedHomes: SavedHome[];
};

export interface LocalPersistenceAdapter {
  load(): Promise<PersistedLocalState>;
  save(payload: PersistedLocalState): Promise<void>;
  clear(): Promise<void>;
}
```

Use one adapter implementation for localStorage now.
This should coexist with session export/import adapters for restore code.

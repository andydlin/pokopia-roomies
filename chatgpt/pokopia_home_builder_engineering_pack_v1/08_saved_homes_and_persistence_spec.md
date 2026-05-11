# Saved Homes and Persistence Spec

## Persistence goals
- current home survives refresh
- saved homes persist locally
- architecture supports remote restore transport

## Storage adapter interfaces

```ts
export type PersistedSessionPayload = {
  currentHome: CurrentHomeState | null;
  savedHomes: SavedHome[];
  exportedAt: number;
};

export interface LocalSessionAdapter {
  load(): PersistedSessionPayload | null;
  save(payload: PersistedSessionPayload): void;
  clear(): void;
}
```

## Local storage behavior
- autosave current home changes with debounce
- autosave saved home CRUD immediately or debounced lightly
- version stored payloads for migration safety

## Saved home actions
- save current
- save as new
- rename
- duplicate
- delete
- load into current workspace

## UX rules
- saving should not block browsing
- loading a saved home should preserve current route/tab
- current unsaved draft can exist independently of saved homes

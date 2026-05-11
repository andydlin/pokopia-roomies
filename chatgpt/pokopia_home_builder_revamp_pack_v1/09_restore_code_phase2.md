# Restore Code (Phase 2 Now)

## Goal
Support cross-device continuity without requiring an account.

Users should be able to:
- generate a restore code on one device
- enter the code on another device
- restore their current home and saved homes locally on that device

## Product framing
Use language like:
- Continue on another device
- Generate restore code
- Restore from code

Do not frame this as full account sync.
This is session portability.

## Scope for this revamp
Implement restore-code support now.
That includes:
- frontend UI for export/import
- backend integration layer
- persistence payload shape
- session import/export adapter
- error/loading states

## Data payload
```ts
export type PersistedSessionPayload = {
  currentHome: CurrentHomeState | null;
  savedHomes: SavedHome[];
  exportedAt: number;
};
```

## Transport interface
```ts
export interface SessionTransportAdapter {
  exportSession(payload: PersistedSessionPayload): Promise<{ code: string; expiresAt?: number | null }>;
  importSession(code: string): Promise<PersistedSessionPayload>;
}
```

## Backend expectations
Implement against a backend contract equivalent to:

### POST /api/session/export
Request body:
```json
{
  "currentHome": {"name":"My Home","pokemonIds":[],"itemIds":[],"habitatId":null},
  "savedHomes": [],
  "exportedAt": 1710000000000
}
```

Response body:
```json
{
  "code": "MOSS-7421",
  "expiresAt": 1710600000000
}
```

### POST /api/session/import
Request body:
```json
{
  "code": "MOSS-7421"
}
```

Response body:
```json
{
  "currentHome": {...},
  "savedHomes": [...],
  "exportedAt": 1710000000000
}
```

If the current repo has no backend, add a simple serverless/API layer compatible with the existing stack or repo deployment model.
Prefer the lightest solution that fits the project.

## Code design expectations
- human-readable codes are okay
- code collision handling required
- expiration handling required
- clear error states for invalid/expired code
- imported session should replace or merge local state in a deliberate way

## UX flows
### Generate restore code
From builder header or settings area:
- user clicks Continue on another device
- modal shows generated code
- show copy button
- optionally leave room for future QR support

### Restore from code
On another device:
- user clicks Restore from code
- enters code
- app loads payload
- user confirms restore if needed
- imported current home + saved homes are persisted locally

## Merge strategy
Default behavior:
- restore code replaces current local currentHome
- restored savedHomes merge by id if safe, or replace local list if simpler for first pass

Recommended first-pass rule:
- ask user:
  - Replace local homes
  - Merge into local homes

If that's too much for first pass, choose replace and make it explicit.

## UI components to add
- TransferSessionModal
- RestoreSessionModal
- RestoreCodeField
- SessionTransportStatus

## State addition
```ts
export type SessionPortabilityState = {
  exportStatus: 'idle' | 'loading' | 'success' | 'error';
  importStatus: 'idle' | 'loading' | 'success' | 'error';
  lastGeneratedCode: string | null;
  lastCodeExpiry: number | null;
  lastError: string | null;
};
```

## Tests
Add tests for:
- payload serialization/deserialization
- export adapter success/error
- import adapter success/error
- invalid code handling
- expired code handling
- merge/replace behavior

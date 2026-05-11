# Restore Code Backend Spec

## Product intent
Allow users to continue on another device without creating an account.

## Phase 2 scope
Implement the app architecture and integration points for a backend-backed restore code flow now.
If a backend is included in the repo/workspace, implement it. If not, define the client/server contracts cleanly and wire the client adapter to those endpoints.

## Session transport adapter

```ts
export interface SessionTransportAdapter {
  exportSession(payload: PersistedSessionPayload): Promise<{ code: string; expiresAt?: number }>;
  importSession(code: string): Promise<PersistedSessionPayload>;
}
```

## Proposed API

### POST /api/session-export
Request body:
```json
{
  "currentHome": { "id": null, "name": "My Home", "pokemonIds": [], "itemIds": [], "habitatId": null, "isDirty": true, "lastSavedAt": null },
  "savedHomes": [],
  "exportedAt": 0
}
```
Response body:
```json
{
  "code": "MOSS-7421",
  "expiresAt": 1770000000000
}
```

### GET /api/session-import/:code
Response body:
```json
{
  "currentHome": null,
  "savedHomes": [],
  "exportedAt": 1770000000000
}
```

## Backend model

```ts
export type PortableSessionRecord = {
  code: string;
  payload: PersistedSessionPayload;
  createdAt: number;
  expiresAt: number;
};
```

## Backend rules
- code expiration: 7 to 30 days
- codes must be unique
- payload size limits should be enforced
- one-time or reusable-until-expiry is acceptable; choose and document behavior
- server should sanitize/validate incoming payloads

## Client UX
- action: Continue on another device
- modal: generate restore code
- separate entry: Restore from code
- restoring should replace local current home + saved homes after confirmation if existing local data exists

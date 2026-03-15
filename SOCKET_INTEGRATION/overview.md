# WebSocket Integration: Full Scope Overview

## Goal

Replace the 3-second HTTP polling loop with a lightweight Bun-native WebSocket notification layer. The server pushes "something changed" pings to connected clients, who then fetch the latest state through the existing HTTP endpoints. This keeps the proven optimistic locking and conflict resolution logic intact while dropping perceived latency from ~3 seconds to ~100ms.

## Guiding Principles

1. **Incremental** — Each step produces a working application. Polling remains as a fallback until the very end.
2. **Minimal surface area** — No new libraries. Bun's native WebSocket support and Nitro's `defineWebSocketHandler` are all we need.
3. **Existing types stay** — `GameRoomSyncRequest`, `GameRoomSyncResponse`, and the optimistic locking model are unchanged. We add a thin notification layer on top.
4. **Backward compatible** — The `transport` field already exists in the type system. We extend `RealtimeTransportStrategy` from `"polling"` to `"polling" | "websocket"` so both paths coexist during migration.

## Architecture Before & After

```
BEFORE (Polling):
  Client ──[setInterval 3s]──> GET /database/players/ ──> MongoDB
  Client ──[on action]──────> POST /database/players/update/ ──> MongoDB

AFTER (WebSocket Notifications + HTTP State):
  Client ──[WebSocket]──────> Server (subscribes to room channel)
  Server ──[after POST]──────> broadcast("room-updated") to room subscribers
  Client ──[on "room-updated"]> GET /database/players/ ──> MongoDB
  Client ──[on action]──────> POST /database/players/update/ ──> MongoDB (unchanged)
```

The WebSocket carries **only lightweight notification messages** (room name + event type, ~50 bytes). Full game state still travels over HTTP, keeping payloads inspectable in dev tools and the sync logic untouched.

## Steps

| Step | Title                                           | What Changes                                            | Risk                                                        |
| ---- | ----------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| 1    | Enable Nitro WebSocket support                  | `nuxt.config.ts`, new server route                      | None — no client changes                                    |
| 2    | Build the server-side room channel manager      | New `server/utils/` module                              | None — unused until Step 4                                  |
| 3    | Broadcast notifications on state mutations      | `update.post.ts`, waiting room endpoints                | None — broadcasts go nowhere until clients connect          |
| 4    | Build the client WebSocket composable           | New `useRealtimeWebSocket.ts` composable                | None — not wired to gameplay yet                            |
| 5    | Wire WebSocket notifications into gameplay sync | `usePlayRoomSync.ts`, `useRealtimeRoom.ts`              | Medium — changes the sync trigger. Polling fallback active. |
| 6    | Wire WebSocket notifications into waiting room  | `waiting-room.vue`                                      | Medium — same as above for waiting room                     |
| 7    | Remove polling fallback and clean up            | Remove `socket.io` deps, old polling code, type cleanup | Low — polling already proven unnecessary at this point      |

## Files Touched Per Step

### Step 1 — Nitro WebSocket Config

- `nuxt.config.ts` (add `nitro.experimental.websocket`)
- `server/routes/_ws.ts` (new — WebSocket endpoint)

### Step 2 — Room Channel Manager

- `server/utils/roomChannels.ts` (new — in-memory room subscription map)

### Step 3 — Server Broadcasts

- `server/routes/database/players/update.post.ts` (add broadcast after successful write)
- `server/routes/database/wait/chat.post.ts` (add broadcast)
- `server/routes/database/wait/ready.post.ts` (add broadcast)
- `server/routes/database/wait/active.post.ts` (add broadcast)
- `server/routes/database/wait/start.post.ts` (add broadcast)

### Step 4 — Client WebSocket Composable

- `composables/gameplay/useRealtimeWebSocket.ts` (new)
- `utils/types.ts` (extend `RealtimeTransportStrategy`, add WebSocket message types)

### Step 5 — Gameplay Integration

- `composables/gameplay/useRealtimeRoom.ts` (accept WebSocket trigger alongside poll timer)
- `composables/gameplay/usePlayRoomSync.ts` (pass WebSocket instance, react to push notifications)

### Step 6 — Waiting Room Integration

- `pages/waiting-room.vue` (replace `setInterval` with WebSocket listener + fallback poll)

### Step 7 — Cleanup

- `package.json` (remove `socket.io`, `socket.io-client`)
- `composables/gameplay/useRealtimeRoom.ts` (remove polling timer code)
- `utils/types.ts` (remove `"polling"` transport, simplify)
- Delete any legacy socket utilities if present

## WebSocket Message Protocol

All messages are JSON with a `type` field:

```typescript
// Client → Server
{ type: "subscribe", room: string, playerId: number }
{ type: "unsubscribe", room: string }
{ type: "ping" }

// Server → Client
{ type: "room-updated", room: string, source: "gameplay" | "chat" | "presence" | "ready" | "start" }
{ type: "player-joined", room: string, playerId: number }
{ type: "player-left", room: string, playerId: number }
{ type: "pong" }
{ type: "error", message: string }
```

No game state travels over WebSocket. Ever. State is always fetched over HTTP to maintain a single source of truth with optimistic locking.

## Estimated Effort

| Step      | Finished | Effort          | Can Ship Independently |
| --------- | -------- | --------------- | ---------------------- |
| 1         | [x]      | 30 min          | Yes                    |
| 2         | [ ]      | 1 hour          | Yes                    |
| 3         | [ ]      | 1 hour          | Yes                    |
| 4         | [ ]      | 2 hours         | Yes                    |
| 5         | [ ]      | 2-3 hours       | Yes                    |
| 6         | [ ]      | 1-2 hours       | Yes                    |
| 7         | [ ]      | 1 hour          | Yes                    |
| **Total** |          | **~1.5-2 days** |                        |

## Rollback Plan

At any point during Steps 1-6, the application works with polling. The WebSocket layer is purely additive. If issues arise in production:

1. Set a feature flag or environment variable (`DISABLE_WEBSOCKET=true`)
2. The client composable falls back to polling (built into Step 5)
3. WebSocket connections are harmlessly ignored

Step 7 (cleanup) is the only irreversible step and should only be done after the WebSocket layer has been stable in production for at least a week.

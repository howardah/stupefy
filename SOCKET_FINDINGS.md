# Socket.io vs Polling: Architecture Analysis for Stupefy

## Current Architecture

Stupefy uses **HTTP polling at a 3-second interval** for all real-time synchronization between players. The core implementation lives in `composables/gameplay/useRealtimeRoom.ts` and `composables/gameplay/usePlayRoomSync.ts`.

### How It Works Today

1. Every 3 seconds, each client sends `GET /database/players/?room=<key>` to fetch the full game state.
2. The client compares a sync signature (`getGameplaySyncSignature()`) against its local state. If different, it applies the server's authoritative state.
3. When a player takes an action (plays a card, attacks, etc.), the client:
   - Mutates local state optimistically
   - Sends a `POST /database/players/update/` with the state patch and an `expectedLastUpdated` timestamp
   - The server performs an optimistic lock check against MongoDB's `last_updated` field
   - On conflict (409), the client discards local changes and applies the server's authoritative state

### Conflict Resolution

The polling system uses **optimistic locking** — if two players act simultaneously, the second write is rejected with a 409, and that client receives the authoritative state. This is a sound strategy for turn-based games where true write collisions are infrequent.

---

## What Socket.io Would Change

| Concern                            | Current (Polling)                                                      | With Socket.io                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Latency to see opponent's move** | Up to 3 seconds                                                        | ~50-150ms                                                                               |
| **Server load per idle player**    | 1 HTTP request every 3s (with full headers, TLS, etc.)                 | 1 persistent TCP connection, near-zero idle cost                                        |
| **Bandwidth**                      | Full game state payload every 3s per client, even when nothing changed | Server pushes only when state changes, only the delta                                   |
| **Conflict detection**             | Optimistic locking with 409 responses                                  | Could use the same, or move to server-authoritative mutations                           |
| **Scaling complexity**             | Stateless — any server instance handles any request                    | Stateful — sticky sessions or a pub/sub layer (Redis adapter) needed for multi-instance |
| **Deployment compatibility**       | Works everywhere, including serverless and Cloudflare Workers          | Requires a long-lived server process; incompatible with serverless                      |
| **Reconnection handling**          | Built into polling (every 3s is a reconnect)                           | Socket.io has built-in reconnection, but you must handle state catchup on reconnect     |
| **Code complexity**                | Simple HTTP request/response cycle                                     | Event-driven architecture, namespace/room management, middleware                        |

---

## Where Polling Actually Hurts

### 1. Attack Resolution and Protego Windows

The most latency-sensitive moment in the game is attack resolution. When a player casts Stupefy, the target needs to see it and (depending on rules) may respond with Protego. With 3-second polling:

- **Worst case**: The target doesn't see the attack for nearly 3 seconds, then their defense response takes another 3 seconds to propagate back. That's up to **6 seconds of dead air** during the most exciting part of the game.
- **Best case**: Both polls happen to align and it takes ~0.5 seconds.

This unpredictable latency makes attack/defense exchanges feel sluggish and disconnected.

### 2. Turn Transitions

When one player ends their turn, all other players are waiting. Currently they discover it's their turn (or that the active player changed) on the next poll cycle. This creates a **perceptible pause** between turns that makes the game feel unresponsive.

### 3. Chat in the Waiting Room

The waiting room has chat functionality (`POST /database/wait/chat/`). Chat is one of the worst use cases for polling — messages feel delayed and conversations can't flow naturally at 3-second granularity.

### 4. Presence/Heartbeat

Player presence is tracked via `POST /database/wait/active/`. Detecting that a player has disconnected takes multiple missed heartbeats. With WebSockets, disconnect detection is near-instant via the `close` event.

### 5. Wasted Bandwidth

During quiet moments (waiting for a player to decide their move), every connected client is still hammering the server every 3 seconds, receiving identical payloads each time. For a 4-player game, that's ~80 redundant requests per minute carrying the full game state.

---

## Where Polling Is Actually Fine

### 1. Turn-Based Core Loop

The fundamental game loop is turn-based. Only one player acts at a time (mostly). You don't need sub-100ms latency for a card game — this isn't an FPS. The 3-second poll is **noticeable but not game-breaking** for the basic flow.

### 2. Deployment Simplicity

The current architecture is fully stateless. Any Nuxt server instance can handle any request. There's no need for sticky sessions, no Redis pub/sub layer, no WebSocket connection balancing. This is a major operational advantage, especially since the project is deployed to Google Cloud App Engine (per `app.yaml`).

### 3. Reliability

HTTP polling is inherently resilient. If a request fails, the next one picks up seamlessly. There's no connection state to manage, no reconnection logic to debug, no edge cases around half-open connections. The exponential backoff in `useRealtimeRoom.ts` (1.5s base, 12s max) handles transient failures gracefully.

### 4. Development Simplicity

The current polling code is clean, well-typed, and easy to reason about. Adding Socket.io would introduce:

- A Nitro server plugin for the Socket.io server
- Room/namespace management logic
- Client-side connection lifecycle management
- Authentication over WebSocket handshake
- A dual transport layer (HTTP for initial load, WebSocket for updates)

---

## Recommendation: Targeted Hybrid, Not Full Migration

**Do not rip out polling and replace it with Socket.io.** Instead, consider a targeted approach:

### Keep Polling For

- Waiting room list (`/database/wait/open/`) — low frequency, works fine
- Initial game state load — HTTP is the right tool for request/response
- Conflict resolution — optimistic locking over HTTP is well-proven

### Use Bun's Native WebSockets For (Not Socket.io)

Given that this project uses Bun and Nuxt/Nitro, **Socket.io is the wrong tool**. Bun has first-class WebSocket support via `Bun.serve({ websocket: ... })`, and Nitro supports WebSocket routes natively via `defineWebSocketHandler`. Socket.io adds ~45KB of client-side JavaScript and a custom protocol on top of WebSockets — overhead that buys you nothing when Bun already handles WebSocket connections natively.

A lightweight WebSocket layer could handle:

1. **State change notifications** — Instead of polling every 3s, the server sends a "room-updated" ping when any player's mutation is persisted. Clients then fetch the new state via the existing HTTP endpoint. This is the **lowest-effort, highest-impact change**: you keep all existing sync logic and just replace the poll timer with a push notification.

2. **Chat messages** — Push chat messages over WebSocket for instant delivery. Tiny payload, big UX improvement.

3. **Presence** — Use WebSocket `open`/`close` events for instant connect/disconnect detection instead of heartbeat polling.

4. **Turn notifications** — Push "it's your turn" events so players see turn transitions instantly.

### What This Looks Like in Practice

```
Current:
  Client ──[poll every 3s]──> GET /database/players/ ──> MongoDB

Proposed:
  Client ──[WebSocket]──> Server (listens for "room-updated" ping)
  Client ──[HTTP]──────> GET /database/players/ (only when pinged)
  Client ──[HTTP]──────> POST /database/players/update/ (on action, unchanged)
  Server ──[after successful POST]──> broadcast "room-updated" to room
```

This approach:

- Eliminates ~95% of polling traffic (only fetch when something changed)
- Reduces perceived latency from up to 3s to ~100ms for seeing opponent moves
- Keeps the proven optimistic locking and conflict resolution logic untouched
- Requires minimal code changes (add a WebSocket route, broadcast on mutation, replace poll timer with WebSocket listener on client)
- Uses Bun/Nitro native WebSocket support — no Socket.io dependency needed

---

## Cost of Full Socket.io Migration

If you went all-in on Socket.io instead of the targeted approach above, you'd face:

1. **Deployment changes** — App Engine standard environment doesn't support WebSockets well. You'd need Flex environment or a different platform.
2. **Multi-instance coordination** — Socket.io requires `@socket.io/redis-adapter` (or similar) for multi-server deployments. That's a new Redis dependency.
3. **Authentication** — Need to implement auth in the WebSocket handshake middleware, duplicating what Nitro already handles for HTTP routes.
4. **State management rewrite** — Moving from "pull state on poll" to "apply pushed deltas" is a fundamental change to the sync model. The current `useRealtimeRoom`, `usePlayRoomSync`, and `useBoardStateSync` composables would all need significant rewrites.
5. **Testing** — WebSocket interactions are harder to test than HTTP request/response cycles.
6. **Bundle size** — Socket.io client adds ~45KB minified to the frontend bundle.
7. **Debugging** — WebSocket frames are harder to inspect than HTTP requests in browser dev tools.

**Estimated effort**: 2-3 weeks for a full migration, vs 2-3 days for the targeted notification approach.

---

## Final Verdict

The current polling design is **functional but noticeably sluggish** for the interactive moments that matter most (attacks, defenses, turn transitions, chat). A full Socket.io migration is overkill for a turn-based card game and introduces operational complexity that isn't justified.

The best path forward is a **lightweight WebSocket notification layer using Bun/Nitro's native WebSocket support**. Keep all existing HTTP sync logic. Just replace the 3-second poll timer with a push notification that tells clients "something changed, go fetch." This gives you the responsiveness of WebSockets with the reliability and simplicity of the current HTTP-based state management.

The `socket.io` and `socket.io-client` packages in `package.json` can be removed — they're unused and unnecessary for this approach.

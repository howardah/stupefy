# Step 7: Remove Polling Fallback and Clean Up

## Objective

Once the WebSocket layer has been stable in production for at least a week, remove the polling fallback, delete unused Socket.io dependencies, and simplify the type system. This is the only irreversible step.

## Prerequisites

Before starting this step, confirm:

- [ ] WebSocket notifications have been working in production for 1+ week
- [ ] No reports of missed state updates from players
- [ ] Reconnection logic handles all observed network conditions
- [ ] Server logs show consistent WebSocket connections (no mass disconnects)
- [ ] You have a rollback plan (revert this commit) if issues surface

## Changes

### 1. Remove Socket.io Dependencies

```bash
bun remove socket.io socket.io-client
```

These were never used — just occupying space in `node_modules` and `bun.lock`.

### 2. Simplify `useRealtimeRoom.ts`

Remove the polling timer entirely. The composable becomes a thin wrapper around "fetch on demand":

**Remove:**

- `setInterval` / `clearInterval` polling loop
- `pollIntervalMs` option
- `fallbackPollIntervalMs` option
- Exponential backoff retry logic (reconnection is now handled by the WebSocket composable)
- `"poll"` and `"retry"` as pull reasons

**Keep:**

- `pullLatest("push")` — triggered by WebSocket notifications
- `pullLatest("connect")` — initial fetch on mount
- `pullLatest("manual")` — for explicit refresh buttons
- `pushStateUpdate()` — unchanged
- `status` tracking — simplify to `"idle" | "syncing" | "connected" | "error"`
- Error handling for individual fetch failures

The composable should still:

- Fetch on connect
- Fetch when `externalPullTrigger` changes
- Handle fetch errors gracefully
- Track last-synced timestamp

**Remove:**

- `"reconnecting"` status (that's the WebSocket's job now)
- Visibility change and online event listeners for polling (the WebSocket reconnect handles this)

### 3. Simplify `waiting-room.vue`

Remove the `setInterval` fallback entirely:

```typescript
// Remove:
refreshTimer = setInterval(() => {
  void refreshRoom();
}, 15_000);

// The WebSocket notification + wsPullTrigger is now the only refresh path.
// Keep the heartbeat timer (separate concern — presence tracking).
```

### 4. Clean Up Types — `utils/types.ts`

```typescript
// Change:
export type RealtimeTransportStrategy = "polling" | "websocket";
// To:
export type RealtimeTransportStrategy = "websocket";

// Remove "polling" from GameRoomSyncRequest and GameRoomSyncResponse transport fields.
// Or remove the transport field entirely if it serves no other purpose.

// Simplify RealtimeRoomStatus:
export type RealtimeRoomStatus = "connected" | "disabled" | "error" | "idle" | "syncing";
// Remove: "reconnecting" (handled by WebSocket composable status)
```

### 5. Update `RealtimeEventMap`

Remove polling transport references:

```typescript
export interface RealtimeEventMap {
  "room:join": { playerId: number; room: string };
  "room:pause": { playerId: number; room: string };
  "room:resume": { playerId: number; room: string };
  "room:sync": {
    expectedLastUpdated?: number;
    playerId: number;
    room: string;
  };
  "wait:chat": { room: string };
  "wait:presence": { room: string };
}
```

### 6. Remove Legacy Socket Utilities

Check for and delete any files related to the old polling infrastructure that are now dead code:

```bash
# Search for any remaining "polling" references
grep -r "polling" composables/ utils/ server/ --include="*.ts" --include="*.vue"
```

Remove or update anything that references the polling transport.

### 7. Update Server Logs

Remove or update any `console.log` statements from Step 1 that were added for debugging:

```typescript
// In server/routes/_ws.ts — reduce verbosity
// Remove: console.log(`[ws] connected: ${peer.id}`);
// Remove: console.log(`[ws] message from ${peer.id}: ${text}`);
// Keep: console.error for actual errors
```

### 8. Update `SOCKET_FINDINGS.md`

Add a note at the top:

```markdown
> **Status**: WebSocket integration complete as of [date]. See `SOCKET_INTEGRATION/` for implementation details.
```

## What NOT to Remove

- **Optimistic locking** — `expectedLastUpdated` and the 409 conflict response stay. They prevent concurrent write corruption and are independent of the transport layer.
- **HTTP endpoints** — All `GET` and `POST` routes stay. The WebSocket is a notification channel, not a data channel. State still flows over HTTP.
- **`pushStateUpdate()`** — Game mutations still go through `POST /database/players/update/`. The WebSocket doesn't carry state writes.
- **Heartbeat** — The waiting room presence heartbeat is a separate concern from real-time state sync. Keep it on its own timer.

## Verification

1. Run `bun run dev`
2. Open Network tab — confirm no periodic GET requests to `/database/players/` (only on-demand after WebSocket notifications)
3. Play a full game between two players — all state transitions should be instant
4. Test waiting room: chat, ready, join, leave, start — all instant
5. Kill the server and restart — clients should reconnect and resume
6. Confirm `socket.io` is gone from `node_modules`:

```bash
ls node_modules | grep socket
# Should return nothing
```

7. Run `bun test` — all existing tests should pass

## Rollback

If issues surface after this step:

1. `git revert <this-commit>` restores the polling fallback
2. The WebSocket layer continues to work alongside polling (back to Step 5/6 state)
3. Investigate the specific failure before re-attempting cleanup
